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

  if (error && !booking) return <p className="text-red-600">{error}</p>;
  if (!booking) return <p>Loading...</p>;

 if (booking.status === "CONFIRMED") {
  return (
    <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
      <h1 className="text-2xl font-bold">Booking confirmed ✓</h1>

      <p className="mt-2">
        {booking.venueName} · {booking.courtName}
      </p>

      <p className="font-medium">
        {booking.bookingDate} · {booking.startTime} - {booking.endTime}
      </p>

      <p className="mt-1 text-sm">
        Total: Rs {booking.totalPricePKR.toLocaleString()}
      </p>

      <Link
        href="/player/dashboard"
        className="mt-4 inline-block rounded bg-green-600 px-4 py-2 text-white"
      >
        Back to home
      </Link>
    </div>
  );
}

  return (
    <div>
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="mt-4 space-y-1 rounded-xl border p-4">
        <p><b>Venue:</b> {booking.venueName}</p>
        <p><b>Address:</b> {booking.address}</p>
        <p><b>Court:</b> {booking.courtName} ({booking.sport})</p>
        <p><b>Date:</b> {booking.bookingDate}</p>
        <p><b>Time:</b> {booking.startTime} - {booking.endTime}</p>
        <p className="pt-2 text-lg font-bold">Total: Rs {booking.totalPricePKR.toLocaleString()}</p>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      <p className="mt-4 text-sm text-gray-500">Your slot is held for 10 minutes.</p>
      <button onClick={handleConfirm} className="mt-2 rounded bg-green-600 px-5 py-2 text-white">
        Confirm booking
      </button>
    </div>
  );
};

const page = () => {
  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-xl p-6">
        <Suspense fallback={<p>Loading...</p>}>
          <CheckoutContent />
        </Suspense>
      </div>
    </RequireRole>
  )
}

export default page