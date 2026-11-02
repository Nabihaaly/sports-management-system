"use client"
import RequireRole from '@/Components/RequireRole';
import { getBooking, confirmBooking } from '../../services/playerDashboard';
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const CheckoutContent = () => {
  const bookingId = useSearchParams().get("bookingId");
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId).then(setBooking).catch((e) => setError(e.message));
  }, [bookingId])

  const handleConfirm = async () => {
    try {
      setBooking(await confirmBooking(booking.id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error && !booking) return <p className="text-sm text-danger">{error}</p>;
  if (!booking) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-4 w-24 animate-pulse rounded-2xl bg-mist" />
        <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-mist" />
        <div className="h-72 animate-pulse rounded-3xl bg-mist" />
      </div>
    );
  }

 if (booking.status === "CONFIRMED") {
  return (
    <div className="card-dark p-6 text-center sm:p-10">
      <span className="inline-flex items-center rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-ink">
        Confirmed
      </span>
      <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
        You&apos;re on court.
      </h1>
      <p className="mt-3 text-sm text-white/70">
        Your booking is locked in. See you there.
      </p>

      <div className="card mt-8 text-left">
        <p className="eyebrow">Booking details</p>

        <p className="mt-2 font-heading text-xl font-black uppercase leading-[0.95] tracking-tight text-ink">
          {booking.venueName} · {booking.courtName}
        </p>

        <p className="mt-2 font-medium text-ink">
          {booking.bookingDate} · {booking.startTime} - {booking.endTime}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">Total paid</span>
          <span className="font-heading text-xl font-black text-ink">
            Rs {booking.totalPricePKR.toLocaleString()}
          </span>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="btn-accent mt-8"
      >
        Back to home
      </Link>
    </div>
  );
}

  return (
    <div>
      <p className="eyebrow">Checkout</p>
      <h1 className="page-title mt-1">Confirm your booking</h1>

      <div className="card mt-8 p-6">
        <p className="eyebrow">Order summary</p>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Venue</dt>
            <dd className="text-right font-medium text-ink">{booking.venueName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Address</dt>
            <dd className="text-right font-medium text-ink">{booking.address}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Court</dt>
            <dd className="text-right font-medium text-ink">{booking.courtName} ({booking.sport})</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Date</dt>
            <dd className="text-right font-medium text-ink">{booking.bookingDate}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Time</dt>
            <dd className="text-right font-medium text-ink">{booking.startTime} - {booking.endTime}</dd>
          </div>
        </dl>

        <div className="card-lime mt-6 flex items-center justify-between p-5">
          <p className="eyebrow text-ink/60">Total</p>
          <span className="font-heading text-3xl font-black uppercase tracking-tight text-ink">
            Rs {booking.totalPricePKR.toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="badge-warning">Your slot is held for 10 minutes.</p>
        <button type="button" onClick={handleConfirm} className="btn-primary w-full sm:w-auto">
          Confirm booking
        </button>
      </div>
    </div>
  );
};

const page = () => {
  return (
    <RequireRole role="PLAYER">
      <div className="page-narrow max-w-xl">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <CheckoutContent />
        </Suspense>
      </div>
    </RequireRole>
  )
}

export default page
