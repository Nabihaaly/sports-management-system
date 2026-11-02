"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getApplicationStatus,
  ApplicationStatus,
} from "../../services/venueApplication";

const POLL_INTERVAL_MS = 10000;

const PendingPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Har 10 sec status poll karo; admin approve kare to agle tick pe dashboard.
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { status } = await getApplicationStatus();
        if (cancelled) return;

        if (status === "APPROVED") {
          router.replace("/venueDashboard");
          return;
        }
        if (status === null) {
          router.replace("/venueApplication");
          return;
        }

        setStatus(status); // PENDING ya REJECTED — yahin dikhao
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
    return (
      <div className="page-narrow flex justify-center pt-20">
        <div
          className="w-full max-w-md space-y-4"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-56 animate-pulse rounded-3xl bg-mist" />
          <p className="eyebrow text-center">Checking your application status...</p>
        </div>
      </div>
    );
  }

  const rejected = status === "REJECTED";

  return (
    <div className="page-narrow flex justify-center pt-20">
      <div className="card w-full max-w-md space-y-6 p-8 text-center">
        <p className="eyebrow">Venue application</p>

        <div className="flex justify-center">
          <span
            className={`${rejected ? "badge-danger" : "badge-warning"} px-4 py-1.5 text-sm`}
          >
            {rejected ? "Rejected" : "Pending review"}
          </span>
        </div>

        <h1 className="font-heading text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink">
          {rejected ? "Application rejected" : "Under review"}
        </h1>

        <p className="text-sm text-muted">
          {rejected
            ? "Unfortunately your venue application was not approved. Please contact support for more details."
            : "Your application is under review. This page will take you to your dashboard automatically once it is approved."}
        </p>

        <div className="rounded-2xl bg-mist p-4 text-left">
          <p className="eyebrow">{rejected ? "From the team" : "What happens next"}</p>
          <p className="mt-1.5 text-sm text-ink">
            {rejected
              ? "Reach out to support with your venue name and we'll walk you through what was missing."
              : "We check every venue by hand. Most reviews finish within a couple of days, and this page refreshes on its own."}
          </p>
        </div>

        {error && (
          <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default PendingPage;
