"use client";

import RequireRole from "@/Components/RequireRole";
import {
  getCourt,
  getSlots,
  createBooking,
  createSplitBooking,
  getAcceptedFriends,
} from "../../../services/playerDashboard";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const capitalize = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

interface AcceptedFriend {
  userId: string;
  name: string;
  displayName: string;
  profilePicture: string | null;
  city: string | null;
}

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

  const [view, setView] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = view.getFullYear();
  const month = view.getMonth();

  const blanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const cells: (Date | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1)
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

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;

          const iso = toISO(date);
          const enabled =
            date >= today &&
            allowedWeekdays.includes(WEEKDAYS[date.getDay()]);
          const isSelected = iso === selectedDate;

          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(iso)}
              className={`rounded py-2 text-sm ${
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

  const [bookingType, setBookingType] = useState<"SINGLE" | "SPLIT">(
    "SINGLE"
  );

  const [friends, setFriends] = useState<AcceptedFriend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableWeekdays: string[] = [
    ...new Set<string>(
      (court?.availabilities || []).map((a: any) => a.dayOfWeek)
    ),
  ];

  const operatingDays: string[] = WEEK_ORDER.filter((day) =>
    (court?.operatingDays?.length
      ? court.operatingDays.map((d: string) => d.trim().toUpperCase())
      : availableWeekdays
    ).includes(day)
  );

  // Load court details.
  useEffect(() => {
    let isMounted = true;

    const loadCourt = async () => {
      setLoadingCourt(true);
      setError("");

      try {
        const data = await getCourt(courtId);
        if (isMounted) setCourt(data);
      } catch (e: any) {
        if (isMounted) setError(e.message || "Unable to load court details");
      } finally {
        if (isMounted) setLoadingCourt(false);
      }
    };

    loadCourt();

    return () => {
      isMounted = false;
    };
  }, [courtId]);

  // Load available slots whenever the selected date changes.
  useEffect(() => {
    if (!date) return;

    let isMounted = true;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      setSelected(null);
      setError("");

      try {
        const data = await getSlots(courtId, date);
        if (isMounted) setSlots(data.slots || []);
      } catch (e: any) {
        if (isMounted) setError(e.message || "Unable to load slots");
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [courtId, date]);

  // Load accepted friends when the player selects split payment.
  useEffect(() => {
    if (bookingType !== "SPLIT") return;

    let isMounted = true;

    const loadFriends = async () => {
      setLoadingFriends(true);
      setError("");

      try {
        const data = await getAcceptedFriends();

        if (isMounted) {
          setFriends(data.friends || []);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e.message || "Unable to load your accepted friends");
        }
      } finally {
        if (isMounted) setLoadingFriends(false);
      }
    };

    loadFriends();

    return () => {
      isMounted = false;
    };
  }, [bookingType]);

  const toggleFriend = (userId: string) => {
    setSelectedFriendIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    );
  };

  // Create either a normal booking or a split booking.
  const handleBook = async () => {
    if (!selected) {
      setError("Please select a time slot first");
      return;
    }

    if (bookingType === "SPLIT" && selectedFriendIds.length === 0) {
      setError("Please select at least one friend for split payment");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (bookingType === "SINGLE") {
        const booking = await createBooking({
          courtId,
          date,
          startTime: selected.startTime,
        });

        router.push(`/checkout?bookingId=${booking.id}`);
      } else {
        await createSplitBooking({
          courtId,
          date,
          startTime: selected.startTime,
          invitedUserIds: selectedFriendIds,
        });

        // The split booking will appear in the player's Slots Held area.
        alert("Invitation successfully sent!");
setPanelOpen(false);
setSelected(null);
setSelectedFriendIds([]);
setBookingType("SINGLE");
      }
    } catch (e: any) {
      setError(e.message || "Unable to create booking");

      // The slot may have just been taken, so reload the slots.
      try {
        const data = await getSlots(courtId, date);
        setSlots(data.slots || []);
        setSelected(null);
      } catch {
        // Keep the original booking error visible.
      }
    } finally {
      setSubmitting(false);
    }
  };

  const participantCount = selectedFriendIds.length + 1;
  const estimatedShare =
    court && participantCount > 0
      ? Math.ceil(court.pricePerSlotPKR / participantCount)
      : 0;

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
                onSelect={(iso) => {
                  setDate(iso);
                  setSelected(null);
                  setError("");
                }}
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

              {selected && (
                <p className="mt-5 rounded bg-gray-50 p-3 text-sm">
                  {date} · {selected.startTime} - {selected.endTime} ·{" "}
                  <b>Rs {court.pricePerSlotPKR.toLocaleString()}</b>
                </p>
              )}

              {selected && (
                <>
                  <h3 className="mt-5 mb-2 font-semibold">
                    3. Choose payment type
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingType("SINGLE");
                        setSelectedFriendIds([]);
                        setError("");
                      }}
                      className={`rounded border p-3 text-sm ${
                        bookingType === "SINGLE"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-300"
                      }`}
                    >
                      <b>Book normally</b>
                      <span className="mt-1 block">
                        Pay Rs {court.pricePerSlotPKR.toLocaleString()}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingType("SPLIT");
                        setError("");
                      }}
                      className={`rounded border p-3 text-sm ${
                        bookingType === "SPLIT"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-300"
                      }`}
                    >
                      <b>Split payment</b>
                      <span className="mt-1 block">
                        Share with friends
                      </span>
                    </button>
                  </div>
                </>
              )}

              {bookingType === "SPLIT" && selected && (
                <div className="mt-5 rounded-xl border p-3">
                  <h3 className="font-semibold">4. Invite your friends</h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Select accepted friends who will share this booking.
                    Everyone will pay their own equal share.
                  </p>

                  {loadingFriends && (
                    <p className="mt-3 text-sm text-gray-500">
                      Loading friends...
                    </p>
                  )}

                  {!loadingFriends && friends.length === 0 && (
                    <p className="mt-3 text-sm text-gray-500">
                      You don't have any accepted friends yet.
                    </p>
                  )}

                  <div className="mt-3 space-y-2">
                    {friends.map((friend) => (
                      <label
                        key={friend.userId}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriendIds.includes(friend.userId)}
                          onChange={() => toggleFriend(friend.userId)}
                          className="h-4 w-4 accent-green-600"
                        />

                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.displayName}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm">
                            {friend.displayName?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium">
                            {friend.displayName || friend.name}
                          </p>
                          {friend.city && (
                            <p className="text-xs text-gray-500">
                              {friend.city}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedFriendIds.length > 0 && (
                    <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
                      <p>
                        <b>Players:</b> {participantCount}
                      </p>
                      <p>
                        <b>Estimated share per player:</b> Rs{" "}
                        {estimatedShare.toLocaleString()}
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        The exact split is calculated by the server. Any
                        rounding difference is added to the creator's share.
                      </p>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-gray-500">
                    Your slot will be held for 30 minutes while friends
                    respond. Once everyone accepts, a 20-minute payment
                    period begins.
                  </p>
                </div>
              )}

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <button
                disabled={
                  !selected ||
                  loadingSlots ||
                  submitting ||
                  (bookingType === "SPLIT" &&
                    (loadingFriends ||
                      friends.length === 0 ||
                      selectedFriendIds.length === 0))
                }
                onClick={handleBook}
                className="btn-primary mt-6 w-full"
              >
                {submitting
                  ? "Processing..."
                  : bookingType === "SPLIT"
                  ? "Send split invitations"
                  : "Book this slot"}
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
};

export default Page;