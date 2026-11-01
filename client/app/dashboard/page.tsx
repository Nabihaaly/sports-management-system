"use client"
import RequireRole from '@/Components/RequireRole';
import { getVenues } from '../../services/playerDashboard';
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from '@/Components/Navbar';

// PAGE 1: all venues in the database, each with a "Show details" button
const page = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getVenues()
      .then(setVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [])

  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-4 text-2xl font-bold">Venues</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && venues.length === 0 && <p>No venues available yet.</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <div key={v.id} className="rounded-xl border p-4">
              {v.images?.[0] && (
                <img src={v.images[0]} alt={v.venueName} className="mb-3 h-40 w-full rounded object-cover" />
              )}
              <h2 className="text-lg font-semibold">{v.venueName}</h2>
              <p className="text-sm text-gray-500">{v.address}, {v.city}</p>
              <p className="mt-1 text-sm">{v.sports.join(", ")} · {v.courtCount} courts</p>
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
  )
}

export default page