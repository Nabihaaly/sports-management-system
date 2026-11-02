"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicVenues } from "@/services/playerDashboard";

type Venue = {
  id: string;
  venueName: string;
  city: string;
  address: string;
  images: string[];
  sports: string[];
  courtCount: number;
};

// Landing (Fig 10): real approved venues from the backend — no dummy data.
const FeaturedVenues = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicVenues()
      .then((data: Venue[]) => setVenues(data.slice(0, 4)))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-mist" />
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-line p-10 text-center">
        <p className="font-heading text-xl font-black uppercase tracking-tight text-ink">
          Venues are being onboarded
        </p>
        <p className="mt-2 text-sm text-muted">
          Own a court?{" "}
          <Link href="/" className="font-semibold text-ink underline underline-offset-4 hover:text-forest">
            Sign up as a venue owner
          </Link>{" "}
          and get listed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {venues.map((v) => (
        <Link
          key={v.id}
          href={`/venue/${v.id}`}
          className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl bg-forest p-5 text-white transition hover:-translate-y-0.5"
        >
          {v.images?.[0] ? (
            <img
              src={v.images[0]}
              alt={v.venueName}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-forest" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center rounded-pill bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
            {v.courtCount} court{v.courtCount === 1 ? "" : "s"}
          </span>
          <div className="relative">
            <p className="eyebrow text-white/70">{v.city}</p>
            <h3 className="mt-1 font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight">
              {v.venueName}
            </h3>
            <p className="mt-1 text-xs text-white/75">{v.sports.slice(0, 2).join(" · ")}</p>
            <span className="btn-accent mt-4 px-4 py-2 text-xs">
              Book now
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeaturedVenues;
