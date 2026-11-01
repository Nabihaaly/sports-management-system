
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
      <div className="mx-auto max-w-5xl p-6">

        {/* Page heading and Profile Icon */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Venues</h1>

          <Link
            href="/Profile"
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

        {/* Search Players */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            Find Players
          </h2>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search players by name..."
              className="w-full rounded-lg border p-3 outline-none focus:border-black"
            />

            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {searchError && (
            <p className="mt-3 text-sm text-red-600">
              {searchError}
            </p>
          )}

   {hasSearched && !searching && !searchError && (
  <div className="mt-5">
    <h3 className="mb-3 font-semibold">
      Search Results
    </h3>

    {players.length === 0 ? (
      <p className="text-sm text-gray-500">
        No players found with that name.
      </p>
    ) : (
      <div className="space-y-2">
        {players.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="block rounded-lg border bg-white p-3 font-medium transition hover:bg-gray-50 hover:text-blue-600"
          >
            {player.displayName}
          </Link>
        ))}
      </div>
    )}
  </div>
)}
        </div>

        {/* Venues */}
        <h2 className="mb-4 text-xl font-bold">
          Available Venues
        </h2>

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
