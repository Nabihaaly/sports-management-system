"use client";

import { useState } from "react";
import {
  Court,
  createCourt,
  CourtType,
  updateCourt,
  WeekDay,
} from "@/services/courts";

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
  // When provided, the form edits this court instead of creating a new one
  court?: Court;
  onClose: () => void;
  onCreated: () => void;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Group a court's saved slots by day for the schedule builder
const scheduleFromCourt = (court?: Court): Schedule => {
  const result: Schedule = {};
  for (const a of court?.availabilities ?? []) {
    if (a.isActive === false) continue;
    (result[a.dayOfWeek] ??= []).push({
      startTime: a.startTime,
      endTime: a.endTime,
    });
  }
  for (const day of Object.keys(result) as WeekDay[]) {
    result[day]!.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return result;
};

const AddCourts = ({ venueId, venueName, court, onClose, onCreated }: Props) => {
  const isEditing = !!court;

  const [courtName, setCourtName] = useState(court?.courtName ?? "");
  const [sport, setSport] = useState(court?.sport ?? SPORTS[0]);
  const [courtType, setCourtType] = useState<CourtType>(
    court?.courtType ?? "OUTDOOR",
  );
  const [maxPlayers, setMaxPlayers] = useState(
    court ? String(court.maxPlayers) : "",
  );
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(
    court ? String(court.bookingDurationMinutes) : "60",
  );
  const [pricePerSlotPKR, setPricePerSlotPKR] = useState(
    court ? String(court.pricePerSlotPKR) : "",
  );
  const [openingTime, setOpeningTime] = useState(court?.openingTime ?? "09:00");
  const [closingTime, setClosingTime] = useState(court?.closingTime ?? "22:00");
  const [description, setDescription] = useState(court?.description ?? "");
  const [isActive, setIsActive] = useState(court?.isActive ?? true);
  const [operatingDays, setOperatingDays] = useState<WeekDay[]>(
    court?.operatingDays ?? WEEKDAYS.map((d) => d.value),
  );
  const [schedule, setSchedule] = useState<Schedule>(() =>
    scheduleFromCourt(court),
  );
  const [activeDay, setActiveDay] = useState<WeekDay>(
    WEEKDAYS.find((d) => (court?.operatingDays ?? []).includes(d.value))
      ?.value ?? "MONDAY",
  );
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
      const payload = {
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
      };
      if (court) {
        await updateCourt(court.id, payload);
      } else {
        await createCourt(payload);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  const input = "input";

  return (
    <div className="modal-backdrop overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-court-title"
        className="modal my-8 max-h-[90vh] max-w-3xl overflow-y-auto p-0"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-sand px-6 py-5 sm:px-8">
          <div className="space-y-1">
            <p className="eyebrow">
              {isEditing ? "Editing court at" : "Adding to"} {venueName}
            </p>
            <h2
              id="add-court-title"
              className="font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-ink"
            >
              {isEditing ? "Edit court" : "Add court"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost -mr-2 -mt-1 h-10 w-10 px-0 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 px-6 py-6 sm:px-8">
          {/* Court details */}
          <section className="space-y-4">
            <div>
              <p className="eyebrow">01 — Court details</p>
              <h3 className="section-title text-xl">The basics</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="court-name" className="label">Court name</label>
                <input
                  id="court-name"
                  required
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g. Court A"
                  className={input}
                />
              </div>

              <div>
                <label htmlFor="court-sport" className="label">Sport</label>
                <select
                  id="court-sport"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className={input}
                >
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="court-type" className="label">Court type</label>
                <select
                  id="court-type"
                  value={courtType}
                  onChange={(e) => setCourtType(e.target.value as CourtType)}
                  className={input}
                >
                  <option value="OUTDOOR">Outdoor</option>
                  <option value="INDOOR">Indoor</option>
                </select>
              </div>

              <div>
                <label htmlFor="court-max-players" className="label">
                  Players allowed at a time
                </label>
                <input
                  id="court-max-players"
                  required
                  type="number"
                  min={1}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className={input}
                />
              </div>

              <div>
                <label htmlFor="court-slot-length" className="label">
                  Default slot length (minutes)
                </label>
                <input
                  id="court-slot-length"
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
                <label htmlFor="court-price" className="label">Price per slot (Rs.)</label>
                <input
                  id="court-price"
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
              <label htmlFor="court-description" className="label">
                Description (optional)
              </label>
              <textarea
                id="court-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={input}
              />
            </div>
          </section>

          {/* Timings */}
          <section className="space-y-4 border-t border-line pt-8">
            <div>
              <p className="eyebrow">02 — Timings</p>
              <h3 className="section-title text-xl">When you&apos;re open</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="court-opening" className="label">Opening time</label>
                <input
                  id="court-opening"
                  required
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="court-closing" className="label">Closing time</label>
                <input
                  id="court-closing"
                  required
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div>
              <p className="label">Operating days</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    aria-pressed={operatingDays.includes(d.value)}
                    className={operatingDays.includes(d.value) ? "chip-active" : "chip"}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Weekly schedule */}
          <section className="space-y-4 border-t border-line pt-8">
            <div className="space-y-1">
              <p className="eyebrow">03 — Weekly schedule</p>
              <h3 className="section-title text-xl">Bookable slots</h3>
              <p className="text-sm text-muted">
                Create the bookable slots for each operating day (for example 9:00–10:00,
                then 11:00–12:00). Build one day, then copy it to the other days.
              </p>
            </div>

            {orderedOperatingDays.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line p-8 text-center">
                <p className="font-heading text-lg font-black uppercase tracking-tight text-ink">
                  No operating days
                </p>
                <p className="mt-1 text-sm text-muted">Select an operating day first.</p>
              </div>
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
                        aria-pressed={currentDay === d.value}
                        className={currentDay === d.value ? "chip-active" : "chip"}
                      >
                        {d.label}
                        <span className="ml-1.5 opacity-60">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slots for the active day */}
                <div className="space-y-2">
                  {currentSlots.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-line p-6 text-center">
                      <p className="text-sm text-muted">No slots yet for this day.</p>
                    </div>
                  )}

                  {currentSlots.map((s, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-2xl bg-mist/60 p-3"
                    >
                      <div>
                        <label htmlFor={`slot-${i}-start`} className="sr-only">
                          Slot {i + 1} start time
                        </label>
                        <input
                          id={`slot-${i}-start`}
                          type="time"
                          required
                          value={s.startTime}
                          onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                          className="input bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={`slot-${i}-end`} className="sr-only">
                          Slot {i + 1} end time
                        </label>
                        <input
                          id={`slot-${i}-end`}
                          type="time"
                          required
                          value={s.endTime}
                          onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                          className="input bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="btn-ghost px-3 text-danger hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={addSlot} className="btn-outline px-4 py-1.5 text-xs">
                      + Add slot
                    </button>
                    <button type="button" onClick={generateSlots} className="btn-ghost px-4 py-1.5 text-xs">
                      Auto-fill with {bookingDurationMinutes || "60"}-min slots
                    </button>
                  </div>
                </div>

                {/* Copy to other days */}
                {orderedOperatingDays.length > 1 && (
                  <div className="space-y-3 rounded-2xl border border-dashed border-line p-4">
                    <p className="text-sm text-muted">
                      Copy {WEEKDAYS.find((d) => d.value === currentDay)?.label}&apos;s
                      schedule to (replaces their existing slots):
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {orderedOperatingDays
                        .filter((d) => d.value !== currentDay)
                        .map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleCopyTarget(d.value)}
                            aria-pressed={copyTargets.includes(d.value)}
                            className={copyTargets.includes(d.value) ? "chip-active" : "chip"}
                          >
                            {d.label}
                          </button>
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
                        className="btn-ghost px-3 py-1 text-xs"
                      >
                        Select all
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={copySchedule}
                      disabled={copyTargets.length === 0 || currentSlots.length === 0}
                      className="btn-outline px-4 py-1.5 text-xs disabled:opacity-40"
                    >
                      Copy schedule
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <label className="flex items-center gap-3 rounded-2xl bg-mist/60 px-4 py-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Court is active and can be booked
          </label>

          {error && (
            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto"
            >
              {loading ? "Saving..." : isEditing ? "Save changes" : "Save court"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourts;
