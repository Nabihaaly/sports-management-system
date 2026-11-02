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
      <div className="page">
        <Link href="/dashboard" className="btn-ghost -ml-4">← Back to venues</Link>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        {!venue && !error && (
          <div className="mt-4 space-y-4" aria-busy="true">
            <div className="h-72 animate-pulse rounded-3xl bg-mist md:h-96" />
            <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-mist" />
            <div className="h-4 w-1/3 animate-pulse rounded-2xl bg-mist" />
          </div>
        )}

        {venue && (
          <>
            {/* Photo gallery */}
            {venue.images.length > 0 && (
              <div
                className={`mt-4 grid gap-2 ${
                  venue.images.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {venue.images.slice(0, 6).map((img: string, i: number) => (
                  <a
                    key={img}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    className={`group overflow-hidden bg-forest ${
                      i === 0
                        ? `rounded-3xl ${venue.images.length > 1 ? "col-span-2 row-span-2" : ""}`
                        : "rounded-2xl"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${venue.venueName} photo ${i + 1}`}
                      className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                        i === 0 ? "min-h-[16rem] md:min-h-[22rem]" : "h-32 md:h-44"
                      }`}
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Title and info */}
            <div className="mt-8">
              <p className="eyebrow">Venue</p>
              <h1 className="page-title mt-1">{venue.venueName}</h1>
              <p className="mt-2 text-muted">{venue.address}, {venue.city}</p>
              {venue.description && (
                <p className="mt-4 max-w-2xl text-ink">{venue.description}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip-active">{venue.city}</span>
                <span className="chip">Size: {venue.sizeOfVenue}</span>
                <span className="chip">Price: {venue.courtsPriceRange}</span>
              </div>
            </div>

            {/* Courts */}
            <div className="mt-12 mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Courts</p>
                <h2 className="section-title mt-1">Choose a court</h2>
              </div>
              {venue.courts.length > 0 && (
                <span className="chip">
                  {venue.courts.length} {venue.courts.length === 1 ? "court" : "courts"}
                </span>
              )}
            </div>

            {venue.courts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-line p-10 text-center">
                <p className="font-heading text-xl font-black uppercase tracking-tight text-ink">
                  No active courts
                </p>
                <p className="mt-2 text-sm text-muted">
                  This venue has no courts open for booking right now.
                </p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {venue.courts.map((c: any) => (
                <div
                  key={c.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-sand transition hover:-translate-y-0.5"
                >
                  <div className="relative h-48 overflow-hidden bg-forest">
                    {c.images?.[0] && (
                      <img
                        src={c.images[0]}
                        alt={c.courtName}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                    <span className="absolute left-4 top-4 inline-flex items-center rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-ink">
                      {c.sport}
                    </span>
                    <h3 className="absolute bottom-4 left-5 right-5 font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight text-white">
                      {c.courtName}
                    </h3>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="chip">{c.courtType}</span>
                    </div>

                    {c.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted">{c.description}</p>
                    )}

                    <Link
                      href={`/court/${c.id}`}
                      className="btn-primary mt-5 self-start"
                    >
                      View court →
                    </Link>
                  </div>
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
