"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireRole from "@/Components/RequireRole";
import {
  BookingStatus,
  getMyVenues,
  getOwnerBookings,
  OwnerBooking,
  OwnerVenue,
} from "@/services/courts";

type View = "UPCOMING" | "TODAY" | "PAST" | "ALL";

const VIEWS: { value: View; label: string }[] = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "TODAY", label: "Today" },
  { value: "PAST", label: "Past" },
  { value: "ALL", label: "All" },
];

const STATUSES: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Any status" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

// "13:00" -> "1:00 PM"
const format12h = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

// "2026-11-04" -> "Wed, 4 Nov"
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const statusBadge: Record<BookingStatus, string> = {
  CONFIRMED: "badge-success",
  PENDING: "badge-warning",
  CANCELLED: "badge-danger",
};

const Page = () => {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [venueId, setVenueId] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [view, setView] = useState<View>("UPCOMING");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, b] = await Promise.all([
        getMyVenues(),
        getOwnerBookings({
          venueId: venueId || undefined,
          status: status || undefined,
        }),
      ]);
      setVenues(v);
      setBookings(b);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [venueId, status]);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayISO();

  // View filter client-side (date comparisons on YYYY-MM-DD strings)
  const visible = useMemo(() => {
    const list = bookings.filter((b) => {
      if (view === "TODAY") return b.bookingDate === today;
      if (view === "UPCOMING") return b.bookingDate >= today;
      if (view === "PAST") return b.bookingDate < today;
      return true;
    });
    // Upcoming: soonest first; others: newest first (API order)
    return view === "UPCOMING"
      ? [...list].sort(
          (a, b) =>
            a.bookingDate.localeCompare(b.bookingDate) ||
            a.startTime.localeCompare(b.startTime),
        )
      : list;
  }, [bookings, view, today]);

  // Summary tiles — always from the full fetched list (not the view filter)
  const todayCount = bookings.filter((b) => b.bookingDate === today && b.status !== "CANCELLED").length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const revenue = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.totalPricePKR, 0);

  return (
    <RequireRole role="OWNER">
      <div className="page space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Owner</p>
            <h1 className="page-title">Bookings</h1>
            <p className="text-sm text-muted">Every slot booked across your venues.</p>
          </div>
          <Link href="/venueDashboard" className="btn-outline">
            Back to dashboard
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-dark">
            <p className="eyebrow text-white/60">Today</p>
            <p className="mt-3 font-heading text-4xl font-black leading-none">{todayCount}</p>
            <p className="mt-2 text-sm text-white/70">bookings on court today</p>
          </div>
          <div className="card-lime">
            <p className="eyebrow text-ink/60">Pending</p>
            <p className="mt-3 font-heading text-4xl font-black leading-none">{pendingCount}</p>
            <p className="mt-2 text-sm text-ink/70">awaiting payment</p>
          </div>
          <div className="card-dark">
            <p className="eyebrow text-white/60">Confirmed revenue</p>
            <p className="mt-3 font-heading text-4xl font-black leading-none">
              Rs {revenue.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-white/70">in the current filter</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                aria-pressed={view === v.value}
                className={view === v.value ? "chip-active" : "chip hover:border-ink"}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setVenueId("")}
              aria-pressed={venueId === ""}
              className={venueId === "" ? "chip-active" : "chip hover:border-ink"}
            >
              All venues
            </button>
            {venues.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVenueId(v.id)}
                aria-pressed={venueId === v.id}
                className={venueId === v.id ? "chip-active" : "chip hover:border-ink"}
              >
                {v.venueName}
              </button>
            ))}

            <select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus | "")}
              className="input ml-auto w-auto min-w-[10rem] py-2"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        {error && (
          <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-mist" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center">
            <p className="font-heading text-2xl font-black uppercase tracking-tight">No bookings here</p>
            <p className="mt-2 text-sm text-muted">
              Try another view or venue — new bookings show up as soon as players lock a slot.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((b) => (
              <li
                key={b.id}
                className={`card flex flex-col gap-4 sm:flex-row sm:items-center ${
                  b.status === "CANCELLED" ? "opacity-60" : ""
                }`}
              >
                {/* Date + time */}
                <div className="flex items-center gap-4 sm:w-56">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-forest text-white">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                      {formatDate(b.bookingDate).split(" ")[0].replace(",", "")}
                    </span>
                    <span className="font-heading text-xl font-black leading-none">
                      {Number(b.bookingDate.split("-")[2])}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold uppercase leading-tight">
                      {format12h(b.startTime)} – {format12h(b.endTime)}
                    </p>
                    <p className="text-xs text-muted">{formatDate(b.bookingDate)}</p>
                  </div>
                </div>

                {/* Court / venue */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.court.courtName}</p>
                  <p className="truncate text-sm text-muted">
                    {b.court.venue.venueName} · {b.court.sport}
                  </p>
                </div>

                {/* Player */}
                <div className="min-w-0 sm:w-48">
                  <p className="label mb-0">Player</p>
                  <p className="truncate text-sm font-medium">{b.user.name || b.user.email}</p>
                </div>

                {/* Price + status */}
                <div className="flex items-center justify-between gap-3 sm:w-44 sm:flex-col sm:items-end">
                  <p className="font-heading text-xl font-black">
                    Rs {b.totalPricePKR.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {b.bookingType === "SPLIT" && <span className="chip">Split</span>}
                    <span className={statusBadge[b.status]}>{b.status.toLowerCase()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </RequireRole>
  );
};

export default Page;
