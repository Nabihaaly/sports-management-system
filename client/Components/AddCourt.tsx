"use client";

import { useState } from "react";
import { createCourt, CourtType, WeekDay } from "@/services/courts";

const SPORTS = [
  "Cricket",
  "Football",
  "Futsal",
  "Padel",
  "Badminton",
  "Tennis",
  "Basketball",
  "Other",
];

export const WEEKDAYS: { value: WeekDay; label: string }[] = [
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat" },
  { value: "SUNDAY", label: "Sun" },
];

type Slot = { startTime: string; endTime: string };
type Schedule = Partial<Record<WeekDay, Slot[]>>;

interface Props {
  venueId: string;
  venueName: string;
  onClose: () => void;
  onCreated: () => void;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

const AddCourts = ({ venueId, venueName, onClose, onCreated }: Props) => {
  const [courtName, setCourtName] = useState("");
  const [sport, setSport] = useState(SPORTS[0]);
  const [courtType, setCourtType] = useState<CourtType>("OUTDOOR");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState("60");
  const [pricePerSlotPKR, setPricePerSlotPKR] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [operatingDays, setOperatingDays] = useState<WeekDay[]>(
    WEEKDAYS.map((d) => d.value),
  );
  const [schedule, setSchedule] = useState<Schedule>({});
  const [activeDay, setActiveDay] = useState<WeekDay>("MONDAY");
  const [copyTargets, setCopyTargets] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orderedOperatingDays = WEEKDAYS.filter((d) =>
    operatingDays.includes(d.value),
  );

  // Always point at a valid day even if the active one was removed
  const currentDay: WeekDay | undefined = operatingDays.includes(activeDay)
    ? activeDay
    : orderedOperatingDays[0]?.value;
  const currentSlots = (currentDay && schedule[currentDay]) || [];

  const toggleDay = (day: WeekDay) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter((d) => d !== day));
      const next = { ...schedule };
      delete next[day];
      setSchedule(next);
      setCopyTargets(copyTargets.filter((d) => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const setDaySlots = (day: WeekDay, slots: Slot[]) =>
    setSchedule({ ...schedule, [day]: slots });

  const addSlot = () => {
    if (!currentDay) return;
    // Start the new slot where the previous one ended
    const last = currentSlots[currentSlots.length - 1];
    const start = last ? last.endTime : openingTime;
    const end = Math.min(
      toMinutes(start) + (Number(bookingDurationMinutes) || 60),
      toMinutes(closingTime),
    );
    setDaySlots(currentDay, [...currentSlots, { startTime: start, endTime: toTime(end) }]);
  };

  const updateSlot = (i: number, patch: Partial<Slot>) => {
    if (!currentDay) return;
    setDaySlots(
      currentDay,
      currentSlots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  };

  const removeSlot = (i: number) => {
    if (!currentDay) return;
    setDaySlots(
      currentDay,
      currentSlots.filter((_, idx) => idx !== i),
    );
  };

  // Quick helper: fill the day with back-to-back slots of the booking duration
  const generateSlots = () => {
    if (!currentDay) return;
    const step = Number(bookingDurationMinutes);
    if (!step || step <= 0) return;
    const slots: Slot[] = [];
    for (
      let t = toMinutes(openingTime);
      t + step <= toMinutes(closingTime);
      t += step
    ) {
      slots.push({ startTime: toTime(t), endTime: toTime(t + step) });
    }
    setDaySlots(currentDay, slots);
  };

  const toggleCopyTarget = (day: WeekDay) =>
    setCopyTargets(
      copyTargets.includes(day)
        ? copyTargets.filter((d) => d !== day)
        : [...copyTargets, day],
    );

  const copySchedule = () => {
    if (!currentDay || copyTargets.length === 0) return;
    const next = { ...schedule };
    for (const day of copyTargets) {
      next[day] = currentSlots.map((s) => ({ ...s }));
    }
    setSchedule(next);
    setCopyTargets([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (operatingDays.length === 0) {
      setError("Select at least one operating day");
      return;
    }
    if (closingTime <= openingTime) {
      setError("Closing time must be after opening time");
      return;
    }

    for (const day of orderedOperatingDays) {
      const slots = schedule[day.value] ?? [];
      if (slots.length === 0) {
        setError(`Add at least one slot for ${day.label}`);
        return;
      }
      for (const s of slots) {
        if (!s.startTime || !s.endTime || s.endTime <= s.startTime) {
          setError(`${day.label}: each slot must end after it starts`);
          return;
        }
        if (s.startTime < openingTime || s.endTime > closingTime) {
          setError(`${day.label}: slots must be within opening and closing time`);
          return;
        }
      }
      const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          setError(`${day.label}: slots overlap`);
          return;
        }
      }
    }

    const availabilities = orderedOperatingDays.flatMap((d) =>
      (schedule[d.value] ?? []).map((s) => ({
        dayOfWeek: d.value,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    );

    setLoading(true);
    try {
      await createCourt({
        venueId,
        courtName,
        sport,
        courtType,
        maxPlayers: Number(maxPlayers),
        bookingDurationMinutes: Number(bookingDurationMinutes),
        description: description || undefined,
        pricePerSlotPKR: Number(pricePerSlotPKR),
        openingTime,
        closingTime,
        operatingDays,
        isActive,
        availabilities,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full border rounded-md p-2";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-auto my-8 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">Add Court</h2>
            <p className="text-sm">Adding to: {venueName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Court details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Court details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Court name</label>
                <input
                  required
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g. Court A"
                  className={input}
                />
              </div>

              <div>
                <label className="block mb-1">Sport</label>
                <select value={sport} onChange={(e) => setSport(e.target.value)} className={input}>
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Court type</label>
                <select
                  value={courtType}
                  onChange={(e) => setCourtType(e.target.value as CourtType)}
                  className={input}
                >
                  <option value="OUTDOOR">Outdoor</option>
                  <option value="INDOOR">Indoor</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Players allowed at a time</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className={input}
                />
              </div>

              <div>
                <label className="block mb-1">Default slot length (minutes)</label>
                <input
                  required
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={bookingDurationMinutes}
                  onChange={(e) => setBookingDurationMinutes(e.target.value)}
                  className={input}
                />
              </div>

              <div>
                <label className="block mb-1">Price per slot (Rs.)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={pricePerSlotPKR}
                  onChange={(e) => setPricePerSlotPKR(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={input}
              />
            </div>
          </div>

          {/* Timings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Timings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Opening time</label>
                <input
                  required
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className="block mb-1">Closing time</label>
                <input
                  required
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div>
              <p className="mb-1">Operating days</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label
                    key={d.value}
                    className={`border rounded-md px-3 py-1 cursor-pointer ${
                      operatingDays.includes(d.value) ? "bg-black text-white" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={operatingDays.includes(d.value)}
                      onChange={() => toggleDay(d.value)}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly schedule */}
          <div className="space-y-3">
            <h3 className="font-semibold">Weekly schedule</h3>
            <p className="text-sm">
              Create the bookable slots for each operating day (for example 9:00–10:00,
              then 11:00–12:00). Build one day, then copy it to the other days.
            </p>

            {orderedOperatingDays.length === 0 ? (
              <p className="text-sm">Select an operating day first.</p>
            ) : (
              <>
                {/* Day tabs */}
                <div className="flex flex-wrap gap-2">
                  {orderedOperatingDays.map((d) => {
                    const count = schedule[d.value]?.length ?? 0;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setActiveDay(d.value)}
                        className={`border rounded-md px-3 py-1 ${
                          currentDay === d.value ? "bg-black text-white" : ""
                        }`}
                      >
                        {d.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Slots for the active day */}
                <div className="space-y-2">
                  {currentSlots.length === 0 && (
                    <p className="text-sm">No slots yet for this day.</p>
                  )}

                  {currentSlots.map((s, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <input
                        type="time"
                        required
                        value={s.startTime}
                        onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                        className={input}
                      />
                      <input
                        type="time"
                        required
                        value={s.endTime}
                        onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                        className={input}
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-4">
                    <button type="button" onClick={addSlot} className="underline">
                      + Add slot
                    </button>
                    <button type="button" onClick={generateSlots} className="underline">
                      Auto-fill with {bookingDurationMinutes || "60"}-min slots
                    </button>
                  </div>
                </div>

                {/* Copy to other days */}
                {orderedOperatingDays.length > 1 && (
                  <div className="border rounded-md p-3 space-y-2">
                    <p className="text-sm">
                      Copy {WEEKDAYS.find((d) => d.value === currentDay)?.label}&apos;s
                      schedule to (replaces their existing slots):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {orderedOperatingDays
                        .filter((d) => d.value !== currentDay)
                        .map((d) => (
                          <label
                            key={d.value}
                            className={`border rounded-md px-3 py-1 cursor-pointer ${
                              copyTargets.includes(d.value) ? "bg-black text-white" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={copyTargets.includes(d.value)}
                              onChange={() => toggleCopyTarget(d.value)}
                            />
                            {d.label}
                          </label>
                        ))}
                      <button
                        type="button"
                        onClick={() =>
                          setCopyTargets(
                            orderedOperatingDays
                              .filter((d) => d.value !== currentDay)
                              .map((d) => d.value),
                          )
                        }
                        className="underline text-sm"
                      >
                        Select all
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={copySchedule}
                      disabled={copyTargets.length === 0 || currentSlots.length === 0}
                      className="border rounded-md px-3 py-1 disabled:opacity-40"
                    >
                      Copy schedule
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Court is active and can be booked
          </label>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="border rounded-md px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save court"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourts;