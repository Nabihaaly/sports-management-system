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
    <div className="rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={isCurrentMonth}
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded px-3 py-1 text-lg disabled:opacity-30"
        >
          ‹
        </button>

        <p className="font-semibold">
          {MONTHS[month]} {year}
        </p>

        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded px-3 py-1 text-lg"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;

          const iso = toISO(date);
          const enabled =
            date >= today &&
            allowedWeekdays.includes(WEEKDAYS[date.getDay()]);
          const isSelected = iso === selectedDate;

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(iso)}
              className={`rounded py-2 text-sm ${
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
      <div className="mx-auto max-w-3xl p-6">
        {loadingCourt && <p>Loading court details...</p>}

        {error && !court && <p className="text-red-600">{error}</p>}

        {court && (
          <>
            <Link
              href={`/venue/${court.venue.id}`}
              className="text-sm text-green-700"
            >
              ← Back to {court.venue.venueName}
            </Link>

            <h1 className="mt-3 text-3xl font-bold">{court.courtName}</h1>

            <p className="text-gray-500">
              {court.venue.venueName} · {court.venue.address},{" "}
              {court.venue.city}
            </p>

            {court.description && <p className="mt-3">{court.description}</p>}

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
                <b>Slot length:</b> {court.bookingDurationMinutes} min
              </p>

              <p>
                <b>Price:</b> Rs {court.pricePerSlotPKR.toLocaleString()} / slot
              </p>

              <p>
                <b>Hours:</b> {court.openingTime} - {court.closingTime}
              </p>
            </div>

            <h2 className="mt-6 text-lg font-semibold">Operating days</h2>

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

            <button
              onClick={() => setPanelOpen(true)}
              disabled={availableWeekdays.length === 0}
              className="mt-8 rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50"
            >
              Book this court
            </button>
          </>
        )}

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
                <h2 className="text-xl font-bold">Book {court.courtName}</h2>

                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <h3 className="mt-5 mb-2 font-semibold">1. Select a date</h3>

              <Calendar
                selectedDate={date}
                allowedWeekdays={availableWeekdays}
                onSelect={(iso) => {
                  setDate(iso);
                  setSelected(null);
                  setError("");
                }}
              />

              <h3 className="mt-5 mb-2 font-semibold">
                2. Select a time slot
              </h3>

              {!date && (
                <p className="text-sm text-gray-500">
                  Select a date to see the slots.
                </p>
              )}

              {date && loadingSlots && (
                <p className="text-sm text-gray-500">Loading slots...</p>
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
                    disabled={slot.status === "BOOKED" || loadingSlots}
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
                className="mt-5 w-full rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50"
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