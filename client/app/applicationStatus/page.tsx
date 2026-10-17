'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApplicationStatus, OwnerStatus } from '../../services/venueApplication';

const POLL_INTERVAL_MS = 10000;

const PendingPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<OwnerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { status } = await getApplicationStatus();
        if (cancelled) return;

        if (status === 'APPROVED') {
          router.replace('/venueDashboard');
          return;
        }
        if (status === 'PENDING') {
          router.replace('/applicationStatus');
          return;
        }

        if (status === null) {
          router.replace('/venueApplication');
          return;
        }
        setStatus(status);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    const timer = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [router]);

  if (loading) {
    return <p className="text-center mt-20">Checking your application status...</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      {status === 'REJECTED' ? (
        <>
          <h1 className="text-2xl font-semibold text-red-600">
            Application rejected
          </h1>
          <p>
            Unfortunately your venue application was not approved. Please
            contact support for more details.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Your status is pending</h1>
          <p>
            Your application is under review. This page will take you to your
            dashboard automatically once it is approved.
          </p>
        </>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};

export default PendingPage



