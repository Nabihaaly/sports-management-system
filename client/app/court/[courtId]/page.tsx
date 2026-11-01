
"use client";

import RequireRole from "@/Components/RequireRole";
import {
  getCourt,
  getSlots,
  createBooking,
} from "../../../services/playerDashboard";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Index matches Date.getDay().
// 0 = Sunday, 1 = Monday, etc.
const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const WEEK_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const capitalize = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase();

// ---------------------------------------------------------------
// Monthly calendar
// Only current-year dates from today onwards can be selected.
// Days when the court does not operate are also disabled.
// ---------------------------------------------------------------

const Calendar = ({
  selectedDate,
  allowedWeekdays,
  onSelect,
}: {
  selectedDate: string;
  allowedWeekdays: string[];
  onSelect: (iso: string) => void;
}) => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();

  const [view, setView] = useState(
    new Date(currentYear, today.getMonth(), 1)
  );

  const year = view.getFullYear();
  const month = view.getMonth();

  const blanks = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const isCurrentMonth =
    year === currentYear &&
    month === today.getMonth();

  const isFirstMonthOfYear =
    year === currentYear && month === 0;

  const isLastMonthOfYear =
    year === currentYear && month === 11;

  // Only display the current year in the year dropdown.
  const years = [currentYear];

  const cells: (Date | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) =>
        new Date(year, month, index + 1)
    ),
  ];

  return (
    <div className="rounded-xl border bg-white p-4">

      {/* Month and year navigation */}

      <div className="mb-5 flex items-center justify-between gap-2">

        <button
          type="button"
          disabled={isFirstMonthOfYear}
          onClick={() =>
            setView(new Date(year, month - 1, 1))
          }
          className="rounded-lg border px-3 py-2 text-lg hover:bg-gray-100 disabled:opacity-30"
        >
          ‹
        </button>

        <div className="flex gap-2">

          <select
            value={month}
            onChange={(e) =>
              setView(
                new Date(year, Number(e.target.value), 1)
              )
            }
            className="rounded-lg border p-2 font-semibold"
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) =>
              setView(
                new Date(Number(e.target.value), month, 1)
              )
            }
            className="rounded-lg border p-2 font-semibold"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

        </div>

        <button
          type="button"
          disabled={isLastMonthOfYear}
          onClick={() =>
            setView(new Date(year, month + 1, 1))
          }
          className="rounded-lg border px-3 py-2 text-lg hover:bg-gray-100 disabled:opacity-30"
        >
          ›
        </button>

      </div>

      {/* Weekday headings */}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">

        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          )
        )}

      </div>

      {/* Calendar dates */}

      <div className="grid grid-cols-7 gap-1">

        {cells.map((date, index) => {

          if (!date) {
            return <div key={`blank-${index}`} />;
          }

          const iso = toISO(date);

          const isPast = date < today;

          const isCorrectYear =
            date.getFullYear() === currentYear;

          const isOperatingDay =
            allowedWeekdays.includes(
              WEEKDAYS[date.getDay()]
            );

          const enabled =
            !isPast &&
            isCorrectYear &&
            isOperatingDay;

          const isSelected = iso === selectedDate;

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(iso)}
              className={`rounded-lg py-2 text-sm transition ${
                isSelected
                  ? "bg-green-600 text-white"
                  : enabled
                  ? "border border-green-500 hover:bg-green-50"
                  : "cursor-not-allowed text-gray-300"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}

      </div>

      <p className="mt-3 text-xs text-gray-500">
        Only future operating days in {currentYear} can be selected.
      </p>

    </div>
  );
};

// ---------------------------------------------------------------
// Main page
// ---------------------------------------------------------------

const Page = () => {
  const { courtId } = useParams<{ courtId: string }>();

  const router = useRouter();

  const [court, setCourt] = useState<any>(null);

  const [loadingCourt, setLoadingCourt] = useState(true);

  const [panelOpen, setPanelOpen] = useState(false);

  const [date, setDate] = useState("");

  const [slots, setSlots] = useState<any[]>([]);

  const [selected, setSelected] = useState<any>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);

  const [error, setError] = useState("");

  // Weekdays that have active availability records.
  const availableWeekdays: string[] = [
    ...new Set<string>(
      (court?.availabilities || [])
        .filter((a: any) => a.isActive === true)
        .map((a: any) => a.dayOfWeek)
    ),
  ];

  // Operating days shown in court details.
  const operatingDays: string[] = WEEK_ORDER.filter((day) =>
    (
      court?.operatingDays?.length
        ? court.operatingDays.map((d: string) =>
            d.trim().toUpperCase()
          )
        : availableWeekdays
    ).includes(day)
  );

  // ---------- 1. Load court details ----------

  useEffect(() => {
    let isMounted = true;

    const loadCourt = async () => {
      setLoadingCourt(true);
      setError("");

      try {
        const data = await getCourt(courtId);

        if (isMounted) {
          setCourt(data);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(
            e.message || "Unable to load court details"
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCourt(false);
        }
      }
    };

    loadCourt();

    return () => {
      isMounted = false;
    };
  }, [courtId]);

  // ---------- 2. Load slots whenever a date is selected ----------

useEffect(() => {
  const courtId = court?.id;

  if (!date || !courtId) return;

  let isMounted = true;

  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      setError('');
      setSelected(null);

      const result = await getSlots(courtId, date);

      if (isMounted) {
        setSlots(result.slots);
      }
    } catch (error: any) {
      if (isMounted) {
        setSlots([]);
        setError(
          error?.response?.data?.message ||
          'Failed to load available slots'
        );
      }
    } finally {
      if (isMounted) {
        setLoadingSlots(false);
      }
    }
  };

  loadSlots();

  return () => {
    isMounted = false;
  };
}, [court?.id, date]);

  // ---------- 3. Select a calendar date ----------

  const handleDateSelect = (iso: string) => {
    setDate(iso);
    setSelected(null);
    setError("");
  };

  // ---------- 4. Save booking and go to checkout ----------

  const handleBook = async () => {
    if (!date) {
      setError("Please select a date first");
      return;
    }

    if (!selected) {
      setError("Please select a time slot first");
      return;
    }

    setError("");

    try {
      const booking = await createBooking({
        courtId,
        date,
        startTime: selected.startTime,
      });

      router.push(
        `/checkout?bookingId=${booking.id}`
      );
    } catch (e: any) {
      setError(
        e.message || "Unable to create booking"
      );

      // Refresh slots if another player booked the slot.
      try {
        const data = await getSlots(courtId, date);

        setSlots(data.slots || []);
        setSelected(null);
      } catch {}
    }
  };

  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-3xl p-6">

        {loadingCourt && (
          <p>Loading court details...</p>
        )}

        {error && !court && (
          <p className="text-red-600">{error}</p>
        )}

        {court && (
          <>

            {/* ---------- Court details ---------- */}

            <Link
              href={`/player/venue/${court.venue.id}`}
              className="text-sm text-green-700"
            >
              ← Back to {court.venue.venueName}
            </Link>

            <h1 className="mt-3 text-3xl font-bold">
              {court.courtName}
            </h1>

            <p className="text-gray-500">
              {court.venue.venueName} ·{" "}
              {court.venue.address},{" "}
              {court.venue.city}
            </p>

            {court.description && (
              <p className="mt-3">
                {court.description}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">

              <p>
                <b>Sport:</b> {court.sport}
              </p>

              <p>
                <b>Type:</b> {court.courtType}
              </p>

              <p>
                <b>Max players:</b> {court.maxPlayers}
              </p>

              <p>
                <b>Slot length:</b>{" "}
                {court.bookingDurationMinutes} min
              </p>

              <p>
                <b>Price:</b> Rs{" "}
                {court.pricePerSlotPKR.toLocaleString()} / slot
              </p>

              <p>
                <b>Hours:</b>{" "}
                {court.openingTime} - {court.closingTime}
              </p>

            </div>

            {/* ---------- Operating days ---------- */}

            <h2 className="mt-6 text-lg font-semibold">
              Operating days
            </h2>

            {operatingDays.length === 0 ? (
              <p className="mt-2 text-gray-500">
                No operating days have been set for this court.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">

                {operatingDays.map((day) => (
                  <span
                    key={day}
                    className="rounded-full border border-green-500 px-3 py-1 text-sm"
                  >
                    {capitalize(day)}
                  </span>
                ))}

              </div>
            )}

            {/* ---------- Book this court ---------- */}

            <button
              onClick={() => {
                setError("");
                setPanelOpen(true);
              }}
              disabled={availableWeekdays.length === 0}
              className="mt-8 rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50"
            >
              Book this court
            </button>

          </>
        )}

        {/* ---------- Booking side panel ---------- */}

        {panelOpen && court && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40"
            onClick={() => setPanelOpen(false)}
          >

            <div
              className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-bold">
                  Book {court.courtName}
                </h2>

                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-2xl leading-none"
                >
                  ×
                </button>

              </div>

              {/* ---------- Calendar ---------- */}

              <h3 className="mb-2 mt-5 font-semibold">
                1. Select a date
              </h3>

              <Calendar
                selectedDate={date}
                allowedWeekdays={availableWeekdays}
                onSelect={handleDateSelect}
              />

              {/* ---------- Time slots ---------- */}

              <h3 className="mb-2 mt-5 font-semibold">
                2. Select a time slot
              </h3>

              {!date && (
                <p className="text-sm text-gray-500">
                  Select a date to see available slots.
                </p>
              )}

              {date && loadingSlots && (
                <p className="text-sm text-gray-500">
                  Loading slots...
                </p>
              )}

              {date && !loadingSlots && slots.length === 0 && (
                <p className="text-sm text-gray-500">
                  No slots on this date.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">

                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={
                      slot.status !== "AVAILABLE" ||
                      loadingSlots
                    }
                    onClick={() => setSelected(slot)}
                    className={`rounded border px-3 py-2 text-sm disabled:cursor-not-allowed ${
                      slot.status === "BOOKED"
                        ? "bg-gray-100 text-gray-400"
                        : selected?.id === slot.id
                        ? "bg-green-600 text-white"
                        : "border-green-500"
                    }`}
                  >
                    {slot.startTime} - {slot.endTime}
                    {slot.status === "BOOKED" && " (Booked)"}
                  </button>
                ))}

              </div>

              {/* ---------- Selected slot summary ---------- */}

              {selected && (
                <p className="mt-5 rounded bg-gray-50 p-3 text-sm">
                  {date} · {selected.startTime} -{" "}
                  {selected.endTime} ·{" "}
                  <b>
                    Rs {court.pricePerSlotPKR.toLocaleString()}
                  </b>
                </p>
              )}

              {error && (
                <p className="mt-4 text-red-600">
                  {error}
                </p>
              )}

              {/* ---------- Book selected slot ---------- */}

              <button
                disabled={!selected || loadingSlots}
                onClick={handleBook}
                className="mt-5 w-full rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50"
              >
                Book this slot
              </button>

            </div>
          </div>
        )}

      </div>
    </RequireRole>
  );
};

export default Page;
