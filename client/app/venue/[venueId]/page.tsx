"use client"
import RequireRole from '@/Components/RequireRole';
import { getVenue } from '../../../services/playerDashboard';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// PAGE 2: one venue - all its details and its available courts
const page = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getVenue(venueId).then(setVenue).catch((e) => setError(e.message));
  }, [venueId])

  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/dashboard" className="text-sm text-green-700">← Back to venues</Link>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {!venue && !error && <p className="mt-4">Loading...</p>}

        {venue && (
          <>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {venue.images.map((img: string) => (
                <img key={img} src={img} alt="" className="h-52 rounded object-cover" />
              ))}
            </div>

            <h1 className="mt-4 text-3xl font-bold">{venue.venueName}</h1>
            <p className="text-gray-500">{venue.address}, {venue.city}</p>
            {venue.description && <p className="mt-3">{venue.description}</p>}
            <p className="mt-2 text-sm">Venue size: {venue.sizeOfVenue} · Price range: {venue.courtsPriceRange}</p>

            <h2 className="mt-8 text-xl font-semibold">Available courts</h2>
            {venue.courts.length === 0 && <p>No active courts right now.</p>}

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {venue.courts.map((c: any) => (
                <div key={c.id} className="rounded-xl border p-4">
                  <h3 className="text-lg font-semibold">{c.courtName}</h3>
                  <p className="text-sm text-gray-500">{c.sport} · {c.courtType}</p>
                  {c.description && <p className="mt-1 text-sm">{c.description}</p>}
                  <Link
                    href={`/court/${c.id}`}
                    className="mt-3 inline-block rounded bg-green-600 px-4 py-2 text-sm text-white"
                  >
                    View court details
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </RequireRole>
  )
}

export default page