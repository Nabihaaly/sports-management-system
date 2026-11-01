
"use client";

import RequireRole from "@/Components/RequireRole";
import { getVenues } from "../../services/playerDashboard";
import { useEffect, useState } from "react";
import Link from "next/link";

const Page = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getVenues()
      .then(setVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-5xl p-6">

        {/* Page heading and Profile Icon */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Venues</h1>

          <Link
            href="/profile"
            title="My Profile"
            aria-label="Open my profile"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
          </Link>
        </div>

        {loading && <p>Loading...</p>}

        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && venues.length === 0 && (
          <p>No venues available yet.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <div key={v.id} className="rounded-xl border p-4">
              {v.images?.[0] && (
                <img
                  src={v.images[0]}
                  alt={v.venueName}
                  className="mb-3 h-40 w-full rounded object-cover"
                />
              )}

              <h2 className="text-lg font-semibold">
                {v.venueName}
              </h2>

              <p className="text-sm text-gray-500">
                {v.address}, {v.city}
              </p>

              <p className="mt-1 text-sm">
                {v.sports.join(", ")} · {v.courtCount} courts
              </p>

              <Link
                href={`/venue/${v.id}`}
                className="mt-3 inline-block rounded bg-green-600 px-4 py-2 text-sm text-white"
              >
                Show details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </RequireRole>
  );
};

export default Page;
