
"use client";

import RequireRole from '@/Components/RequireRole';
import {
  getBooking,
  confirmBooking,
  confirmSplitPayment,
} from '../../services/playerDashboard';
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const CheckoutContent = () => {
  const bookingId = useSearchParams().get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    getBooking(bookingId)
      .then(setBooking)
      .catch((e) => setError(e.message));
  }, [bookingId]);

  const handleConfirm = async () => {
    try {
      setError("");
      setLoading(true);

      if (booking.bookingType === "SPLIT") {
        // Record this participant's payment
        await confirmSplitPayment(booking.id);

        // Fetch the complete updated booking again
        const updatedBooking = await getBooking(booking.id);
        setBooking(updatedBooking);
      } else {
        const updatedBooking = await confirmBooking(booking.id);
        setBooking(updatedBooking);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Correct amount for the current participant
  const amount =
    booking?.bookingType === "SPLIT"
      ? booking.currentParticipant?.amountPKR
      : booking?.totalPricePKR;

  if (error && !booking) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!booking) {
    return <p>Loading...</p>;
  }

  // Booking is confirmed only when everyone has paid
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

        <p className="pt-2 text-lg font-bold">
          {booking.bookingType === "SPLIT"
            ? `Your share: Rs ${Number(amount ?? 0).toLocaleString()}`
            : `Total: Rs ${Number(amount ?? 0).toLocaleString()}`}
        </p>

        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded bg-green-600 px-4 py-2 text-white"
        >
          Back to home
        </Link>
      </div>
    );
  }

  // Check whether this participant has already paid
  const hasPaid =
    booking.bookingType === "SPLIT" &&
    booking.currentParticipant?.paymentStatus === "PAID";

  return (
    <div>
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="mt-4 space-y-1 rounded-xl border p-4">
        <p><b>Venue:</b> {booking.venueName}</p>
        <p><b>Address:</b> {booking.address}</p>
        <p><b>Court:</b> {booking.courtName} ({booking.sport})</p>
        <p><b>Date:</b> {booking.bookingDate}</p>
        <p><b>Time:</b> {booking.startTime} - {booking.endTime}</p>

        <p className="pt-2 text-lg font-bold">
          {booking.bookingType === "SPLIT"
            ? `Your share: Rs ${Number(amount ?? 0).toLocaleString()}`
            : `Total: Rs ${Number(amount ?? 0).toLocaleString()}`}
        </p>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {booking.bookingType === "SPLIT" ? (
        hasPaid ? (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-center">
            <p className="font-semibold text-green-700">
              Your share has been paid ✓
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Waiting for the other participants to complete their payments.
              Your booking will be confirmed once everyone has paid.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-gray-500">
              You have 20 minutes to complete your split booking payment.
            </p>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="mt-2 rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm booking"}
            </button>
          </>
        )
      ) : (
        <>
          <p className="mt-4 text-sm text-gray-500">
            Your slot is held for 10 minutes.
          </p>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="mt-2 rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm booking"}
          </button>
        </>
      )}
    </div>
  );
};

const Page = () => {
  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-xl p-6">
        <Suspense fallback={<p>Loading...</p>}>
          <CheckoutContent />
        </Suspense>
      </div>
    </RequireRole>
  );
};

export default Page;
