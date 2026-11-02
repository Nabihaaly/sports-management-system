
"use client";

import RequireRole from "@/Components/RequireRole";
import PlayersNotifications from "@/Components/PlayersNotifications";
import RequestToPlay from "@/Components/RequestToPlay";
import MatchPlayersButton from "@/Components/MatchPlayersButton";

import {
  getVenues,
  getHeldBookings,
} from "../../services/playerDashboard";

import {
  searchPlayers,
  PlayerSearchResult,
} from "../../services/playerProfile";

import { useEffect, useState } from "react";
import Link from "next/link";

const Page = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Player search states
  const [searchName, setSearchName] = useState("");
  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Held booking states
  const [heldBookings, setHeldBookings] = useState<any[]>([]);
  const [heldOpen, setHeldOpen] = useState(false);
  const [heldLoading, setHeldLoading] = useState(false);
  const [heldError, setHeldError] = useState("");

  // Load venues
  useEffect(() => {
    getVenues()
      .then(setVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Search players
  const handleSearch = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
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
        e instanceof Error
          ? e.message
          : "Failed to search players"
      );
      setPlayers([]);
    } finally {
      setSearching(false);
    }
  };

  // Toggle held slots dropdown
  const handleToggleHeld = async () => {
    const shouldOpen = !heldOpen;

    setHeldOpen(shouldOpen);

    if (!shouldOpen) return;

    setHeldLoading(true);
    setHeldError("");

    try {
      const result = await getHeldBookings();
      setHeldBookings(result.bookings || []);
    } catch (e) {
      setHeldError(
        e instanceof Error
          ? e.message
          : "Failed to load held slots"
      );
    } finally {
      setHeldLoading(false);
    }
  };

  return (
    <RequireRole role="PLAYER">
      <div className="page">

        {/* Page heading, Slots Held, Notifications and Profile */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Venues</h1>

          <div className="flex items-center gap-3">

            <RequestToPlay />

            <MatchPlayersButton />

            {/* Slots Held */}
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleHeld}
                title="Slots Held"
                aria-label="Open held slots"
                aria-expanded={heldOpen}
                className="relative flex h-11 items-center gap-2 rounded-full border border-gray-300 px-4 text-sm font-medium transition hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>

                Slots Held

                {heldBookings.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                    {heldBookings.length}
                  </span>
                )}
              </button>

              {/* Held Slots Dropdown */}
              {heldOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-white p-4 shadow-lg">

                  <h2 className="mb-3 text-lg font-semibold">
                    Your Held Slots
                  </h2>

                  {heldLoading && (
                    <p className="text-sm text-gray-500">
                      Loading held slots...
                    </p>
                  )}

                  {heldError && (
                    <p className="mb-3 text-sm text-red-600">
                      {heldError}
                    </p>
                  )}

                  {!heldLoading &&
                    !heldError &&
                    heldBookings.length === 0 && (
                      <p className="text-sm text-gray-500">
                        You don&apos;t have any active held slots.
                      </p>
                    )}

                  <div className="max-h-96 space-y-3 overflow-y-auto">

                    {!heldLoading &&
                      heldBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-lg border p-3"
                        >
                          <h3 className="font-semibold">
                            {booking.venueName}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {booking.courtName} · {booking.sport}
                          </p>

                          <p className="mt-2 text-sm">
                            <span className="font-medium">
                              Date:
                            </span>{" "}
                            {new Date(
                              booking.bookingDate
                            ).toLocaleDateString()}
                          </p>

                          <p className="text-sm">
                            <span className="font-medium">
                              Time:
                            </span>{" "}
                            {booking.startTime} - {booking.endTime}
                          </p>

                          <p className="text-sm">
                            <span className="font-medium">
                              Price:
                            </span>{" "}
                            PKR {booking.totalPricePKR}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {booking.address}
                          </p>

                       {booking.bookingType === "SPLIT" &&
booking.splitStatus !== "READY_FOR_PAYMENT" ? (
  <button
    type="button"
    disabled
    className="mt-3 block w-full cursor-not-allowed rounded-lg bg-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-500"
  >
    Waiting for friends to accept
  </button>
) : (
  <Link
    href={`/checkout?bookingId=${booking.id}`}
    className="mt-3 block rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700"
  >
    Checkout
  </Link>
)}
                        </div>
                      ))}

                  </div>

                  <button
                    type="button"
                    onClick={() => setHeldOpen(false)}
                    className="mt-3 w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Friend Requests Heart Icon */}
            <PlayersNotifications />

            {/* Existing Profile Icon */}
            <Link
              href="/Profile"
              title="My Profile"
              aria-label="Open my profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 transition hover:bg-gray-100"
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
