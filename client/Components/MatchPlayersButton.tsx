"use client";

// "Match with players" button + popup.
// Dashboard pe:   <MatchPlayersButton />                  -> sirf request ke hisaab se matching
// Court page pe:  <MatchPlayersButton courtId={courtId} /> -> court ka sport, city, price bhi check hota hai

import { useState } from "react";
import Link from "next/link";
import { getPlayerMatches, MatchesResponse } from "@/services/playerMatching";

const fmt = (iso: string, withDay = false) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Karachi",
    ...(withDay ? { weekday: "short", day: "numeric", month: "short" } : {}),
    hour: "numeric",
    minute: "2-digit",
  });

const scoreColor = (s: number) =>
  s >= 85 ? "bg-green-600" : s >= 65 ? "bg-yellow-500" : "bg-gray-400";

const MatchPlayersButton = ({
  courtId,
  className = "rounded-full border border-green-600 px-4 py-3 text-sm font-medium text-green-700 transition hover:bg-green-50",
}: {
  courtId?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setIsOpen(true);
    setLoading(true);
    setError("");
    setData(null);
    try {
      setData(await getPlayerMatches({ courtId, limit: 10 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={open} className={className}>
        Match with players
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white p-6 text-black shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Best matched players</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-2xl text-gray-500 hover:text-black"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Meri request ki summary */}
            {data && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p>
                  <b>Your request:</b> {data.myRequest.preferredSport} ·{" "}
                  {fmt(data.myRequest.availableFrom, true)} – {fmt(data.myRequest.availableUntil)} · Budget Rs{" "}
                  {data.myRequest.budget}
                </p>
                {data.court && (
                  <p className="mt-1">
                    <b>Court:</b> {data.court.venueName} – {data.court.courtName} · Rs{" "}
                    {data.court.perPlayerSharePKR} per player
                  </p>
                )}
              </div>
            )}

            {/* Body */}
            <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
              {loading && <p className="py-8 text-center text-gray-500">Finding players…</p>}

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {error}
                  {error.includes("Request to Play") && (
                    <p className="mt-2">Use the “+ Request to Play” button on the dashboard first.</p>
                  )}
                </div>
              )}

              {data && data.matches.length === 0 && (
                <p className="py-8 text-center text-gray-500">
                  No matching players yet. Try a different time{courtId ? " or court" : ""}.
                </p>
              )}

              {data?.matches.map((m, i) => (
                <div key={m.userId} className="flex gap-4 rounded-xl border p-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-white ${scoreColor(m.score)}`}
                    title="Match score out of 100"
                  >
                    {m.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">
                        #{i + 1} {m.displayName}
                      </p>
                      <Link href={`/players/${m.profileId}`} className="shrink-0 text-sm text-green-700 hover:underline">
                        View profile
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600">
                      {m.skillLevel ?? "Skill not set"} · Budget Rs {m.budget} · Free{" "}
                      {fmt(m.overlapFrom)} – {fmt(m.overlapUntil)}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {m.reasons.map((r) => (
                        <li key={r} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                          {r}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">
                      Time {m.breakdown.time}/40 · Skill {m.breakdown.skill}/35 · Budget {m.breakdown.budget}/25
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MatchPlayersButton;
