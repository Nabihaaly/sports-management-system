
"use client";

import RequireRole from "@/Components/RequireRole";
import { getVenues } from "../../services/playerDashboard";
import { searchPlayers, PlayerSearchResult } from "../../services/playerProfile";
import { useEffect, useState } from "react";
import Link from "next/link";

const Page = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchName, setSearchName] = useState("");
  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    getVenues()
      .then(setVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!searchName.trim()) {
      setPlayers([]);
      setHasSearched(false);
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");
    setHasSearched(true);

    try {
      const result = await searchPlayers(searchName);
      setPlayers(result.players);
    } catch (e) {
      setSearchError(
        e instanceof Error ? e.message : "Failed to search players"
      );
      setPlayers([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <RequireRole role="PLAYER">
      <div className="page">

        {/* Page heading and Profile Icon */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Player</p>
            <h1 className="page-title mt-1">Find your court</h1>
            <p className="mt-2 text-sm text-muted">
              Browse venues near you or look up a player to match with.
            </p>
          </div>

          <Link
            href="/Profile"
            title="My Profile"
            aria-label="Open my profile"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-sand text-ink transition hover:bg-ink hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
          </Link>
        </div>

        {/* Search Players */}
        <section className="card-dark mb-12 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <p className="eyebrow text-lime">Find players</p>
              <h2 className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
                Need a partner<br />or an opponent?
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Search by display name to view a player&apos;s public card.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search players by name..."
                aria-label="Search players by name"
                className="input border-white/10 bg-white/10 text-white placeholder:text-white/50 focus:border-lime focus:bg-white/15"
              />

              <button
                type="submit"
                disabled={searching}
                className="btn-accent shrink-0"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>
          </div>

          {searchError && (
            <p className="mt-4 text-sm text-lime">
              {searchError}
            </p>
          )}

          {hasSearched && !searching && !searchError && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="eyebrow text-white/60">
                Search results
              </h3>

              {players.length === 0 ? (
                <p className="mt-3 text-sm text-white/70">
                  No players found with that name.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {players.map((player) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime hover:text-ink"
                    >
                      <span>{player.displayName}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Venues */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Venues</p>
            <h2 className="section-title mt-1">
              Available venues
            </h2>
          </div>
          {!loading && !error && venues.length > 0 && (
            <span className="chip">
              {venues.length} {venues.length === 1 ? "venue" : "venues"}
            </span>
          )}
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-mist" />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {!loading && !error && venues.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center">
            <p className="font-heading text-xl font-black uppercase tracking-tight text-ink">
              No venues yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Check back soon — new courts are being added.
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <div
              key={v.id}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-forest transition hover:-translate-y-0.5"
            >
              {v.images?.[0] && (
                <img
                  src={v.images[0]}
                  alt={v.venueName}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

              <span className="absolute left-4 top-4 inline-flex items-center rounded-pill bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
                {v.city}
              </span>

              <div className="relative p-5 text-white">
                <h2 className="font-heading text-2xl font-black uppercase leading-[0.95] tracking-tight">
                  {v.venueName}
                </h2>

                <p className="mt-1.5 line-clamp-1 text-sm text-white/70">
                  {v.address}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {v.sports.map((sport: string) => (
                    <span
                      key={sport}
                      className="inline-flex items-center rounded-pill border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white"
                    >
                      {sport}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-white/70">
                    {v.courtCount} {v.courtCount === 1 ? "court" : "courts"}
                  </p>

                  <Link
                    href={`/venue/${v.id}`}
                    className="btn-accent px-4 py-2"
                  >
                    View venue →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </RequireRole>
  );
};

export default Page;
