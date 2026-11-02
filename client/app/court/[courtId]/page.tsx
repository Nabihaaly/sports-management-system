
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
    <div className="rounded-3xl border border-line bg-white p-4">

      {/* Month and year navigation */}

      <div className="mb-4 flex items-center justify-between gap-2">

        <button
          type="button"
          disabled={isFirstMonthOfYear}
          onClick={() =>
            setView(new Date(year, month - 1, 1))
          }
          aria-label="Previous month"
          className="btn-ghost h-9 w-9 px-0 text-lg disabled:opacity-30"
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
            aria-label="Month"
            className="input w-auto rounded-pill py-2 font-semibold"
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
            aria-label="Year"
            className="input w-auto rounded-pill py-2 font-semibold"
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
          aria-label="Next month"
          className="btn-ghost h-9 w-9 px-0 text-lg disabled:opacity-30"
        >
          ›
        </button>

      </div>

      {/* Weekday headings */}

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">

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

          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              className={`aspect-square rounded-2xl text-sm font-semibold transition ${
                isSelected
                  ? "bg-ink text-white"
                  : enabled
                  ? "bg-mist/60 text-ink hover:bg-lime"
                  : "cursor-not-allowed text-muted/50"
              } ${isToday && !isSelected ? "ring-1 ring-ink" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}

      </div>

      <p className="mt-3 text-xs text-muted">
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
      <div className="page-narrow">

        {loadingCourt && (
          <div className="space-y-4" aria-busy="true">
            <div className="h-64 animate-pulse rounded-3xl bg-mist md:h-88" />
            <div className="h-40 animate-pulse rounded-3xl bg-mist" />
          </div>
        )}

        {error && !court && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {court && (
          <>

            {/* ---------- Court details ---------- */}

            <Link
              href={`/venue/${court.venue.id}`}
              className="btn-ghost -ml-4"
            >
              ← Back to {court.venue.venueName}
            </Link>

            {/* Court photos */}
            {court.images?.length > 0 && (
              <div
                className={`mt-4 grid gap-2 ${
                  court.images.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {court.images.slice(0, 6).map((url: string, i: number) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={`group overflow-hidden bg-forest ${
                      i === 0
                        ? `rounded-3xl ${court.images.length > 1 ? "col-span-2 row-span-2" : ""}`
                        : "rounded-2xl"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${court.courtName} photo ${i + 1}`}
                      className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                        i === 0 ? "min-h-[16rem] md:min-h-[22rem]" : "h-32 md:h-44"
                      }`}
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Court hero */}
            <div className="card mt-4 p-6 sm:p-8">
              <p className="eyebrow">Court</p>

              <div className="mt-1 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="page-title">
                    {court.courtName}
                  </h1>

                  <p className="mt-2 text-muted">
                    {court.venue.venueName} ·{" "}
                    {court.venue.address},{" "}
                    {court.venue.city}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip-active">{court.sport}</span>
                    <span className="chip">{court.courtType}</span>
                  </div>
                </div>

                <div className="card-lime shrink-0 px-5 py-4 text-left sm:min-w-[11rem] sm:text-right">
                  <p className="eyebrow text-ink/60">Per slot</p>
                  <p className="mt-1 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-ink">
                    Rs {court.pricePerSlotPKR.toLocaleString()}
                  </p>
                </div>
              </div>

              {court.description && (
                <p className="mt-5 text-ink">
                  {court.description}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-3">

                <div>
                  <p className="eyebrow">Max players</p>
                  <p className="mt-1 font-heading text-xl font-black text-ink">{court.maxPlayers}</p>
                </div>

                <div>
                  <p className="eyebrow">Slot length</p>
                  <p className="mt-1 font-heading text-xl font-black text-ink">
                    {court.bookingDurationMinutes} min
                  </p>
                </div>

                <div>
                  <p className="eyebrow">Hours</p>
                  <p className="mt-1 font-heading text-xl font-black text-ink">
                    {court.openingTime} - {court.closingTime}
                  </p>
                </div>

              </div>
            </div>

            {/* ---------- Operating days ---------- */}

            <p className="eyebrow mt-10">Schedule</p>
            <h2 className="section-title mt-1">
              Operating days
            </h2>

            {operatingDays.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No operating days have been set for this court.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">

                {operatingDays.map((day) => (
                  <span
                    key={day}
                    className="chip"
                  >
                    {capitalize(day)}
                  </span>
                ))}

              </div>
            )}

            {/* ---------- Book this court ---------- */}

            <div className="card-dark mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow text-lime">Ready to play?</p>
                <p className="mt-1 font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight text-white">
                  Pick a date and lock in your slot
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setPanelOpen(true);
                }}
                disabled={availableWeekdays.length === 0}
                className="btn-accent shrink-0"
              >
                Book this court →
              </button>
            </div>

          </>
        )}

        {/* ---------- Booking side panel ---------- */}

        {panelOpen && court && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          >

            <div
              className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-cream p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Book a slot"
            >

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="eyebrow">Book a slot</p>
                  <h2 className="section-title mt-1">
                    {court.courtName}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close"
                  className="btn-ghost h-9 w-9 px-0 text-2xl leading-none"
                >
                  ×
                </button>

              </div>

              {/* ---------- Calendar ---------- */}

              <h3 className="eyebrow mb-3 mt-8">
                1. Select a date
              </h3>

              <Calendar
                selectedDate={date}
                allowedWeekdays={availableWeekdays}
                onSelect={handleDateSelect}
              />

              {/* ---------- Time slots ---------- */}

              <h3 className="eyebrow mb-3 mt-8">
                2. Select a time slot
              </h3>

              {!date && (
                <div className="rounded-3xl border border-dashed border-line p-6 text-center">
                  <p className="font-heading text-base font-black uppercase tracking-tight text-ink">
                    Pick a date first
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Available slots will show up here.
                  </p>
                </div>
              )}

              {date && loadingSlots && (
                <div className="grid grid-cols-2 gap-2" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-11 animate-pulse rounded-2xl bg-mist" />
                  ))}
                </div>
              )}

              {date && !loadingSlots && slots.length === 0 && (
                <div className="rounded-3xl border border-dashed border-line p-6 text-center">
                  <p className="font-heading text-base font-black uppercase tracking-tight text-ink">
                    No slots on this date
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Try another operating day.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">

                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={
                      slot.status !== "AVAILABLE" ||
                      loadingSlots
                    }
                    onClick={() => setSelected(slot)}
                    aria-pressed={selected?.id === slot.id}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                      slot.status === "BOOKED"
                        ? "border-mist bg-mist text-muted line-through"
                        : selected?.id === slot.id
                        ? "border-lime bg-lime text-ink"
                        : "border-line bg-white text-ink hover:border-ink"
                    }`}
                  >
                    {slot.startTime} - {slot.endTime}
                    {slot.status === "BOOKED" && (
                      <span className="sr-only"> (Booked)</span>
                    )}
                  </button>
                ))}

              </div>

              {/* ---------- Selected slot summary ---------- */}

              {selected && (
                <div className="card-dark mt-8 flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="eyebrow text-lime">Your slot</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {date}
                    </p>
                    <p className="text-sm text-white/70">
                      {selected.startTime} - {selected.endTime}
                    </p>
                  </div>
                  <p className="font-heading text-2xl font-black uppercase tracking-tight text-lime">
                    Rs {court.pricePerSlotPKR.toLocaleString()}
                  </p>
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}

              {/* ---------- Book selected slot ---------- */}

              <button
                type="button"
                disabled={!selected || loadingSlots}
                onClick={handleBook}
                className="btn-primary mt-6 w-full"
              >
                Continue →
              </button>

            </div>
          </div>
        )}

      </div>
    </RequireRole>
  );
};

export default Page;
