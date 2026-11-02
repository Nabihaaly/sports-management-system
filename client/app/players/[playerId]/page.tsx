
"use client";

import RequireRole from "@/Components/RequireRole";
import {
  getPublicProfile,
  PublicPlayerProfile,
  sendFriendRequest,
} from "@/services/playerProfile";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";


const Page = () => {
  const params = useParams();
  const id = params.playerId as string;

  const [profile, setProfile] =
    useState<PublicPlayerProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
const [requestSent, setRequestSent] = useState(false);
const [friendError, setFriendError] = useState("");
const [friendMessage, setFriendMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    getPublicProfile(id)
      .then((result) => setProfile(result.profile))
      .catch((e) => {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load player profile"
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddFriend = async () => {
  if (!profile) return;

  try {
    setSendingRequest(true);
    setFriendError("");
    setFriendMessage("");

    const result = await sendFriendRequest(profile.id);

    setRequestSent(true);
    setFriendMessage(result.message);
  } catch (error) {
    setFriendError(
      error instanceof Error
        ? error.message
        : "Failed to send friend request"
    );
  } finally {
    setSendingRequest(false);
  }
};

  return (
    <RequireRole role="PLAYER">
      <div className="page-narrow">

        <Link
          href="/dashboard"
          className="btn-ghost -ml-4 mb-6"
        >
          ← Back to venues
        </Link>

        {loading && (
          <div className="space-y-4" aria-busy="true">
            <div className="h-56 animate-pulse rounded-3xl bg-mist" />
            <div className="h-32 animate-pulse rounded-3xl bg-mist" />
          </div>
        )}

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {!loading && !error && profile && (
          <div className="space-y-5">

            {/* Profile Header */}
            <div className="card p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.displayName}
                    className="h-32 w-32 shrink-0 rounded-full object-cover ring-4 ring-lime"
                  />
                ) : (
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-forest font-heading text-5xl font-black text-lime ring-4 ring-lime">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="text-center sm:text-left">
                  <p className="eyebrow">Player card</p>

                  <h1 className="page-title mt-1">
                    {profile.displayName}
                  </h1>

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="chip">{profile.city}</span>
                    {profile.skillLevel && (
                      <span className="chip-active">{profile.skillLevel}</span>
                    )}
                    <span
                      className={
                        profile.availableForMatching
                          ? "badge-success"
                          : "badge-warning"
                      }
                    >
                      {profile.availableForMatching
                        ? "Available for matching"
                        : "Not available for matching"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6 border-t border-line pt-6">
                <h2 className="eyebrow">About</h2>
                <p className="mt-2 text-ink">
                  {profile.bio || "No bio added yet."}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card-dark">
                <p className="eyebrow text-lime">Skill level</p>
                <p className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
                  {profile.skillLevel || "—"}
                </p>
              </div>

              <div className="card-dark">
                <p className="eyebrow text-lime">Home city</p>
                <p className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
                  {profile.city}
                </p>
              </div>

              <div className="card-dark">
                <p className="eyebrow text-lime">Sports</p>
                <p className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
                  {profile.preferredSports.length}
                </p>
              </div>
            </div>

            {/* Preferred Sports */}
            <div className="card p-6">
              <h2 className="eyebrow">
                Preferred sports
              </h2>

              {profile.preferredSports.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.preferredSports.map((sport) => (
                    <span
                      key={sport}
                      className="chip-active"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  No preferred sports added.
                </p>
              )}
            </div>

            <div className="mt-4">
  <button
    onClick={handleAddFriend}
    disabled={sendingRequest || requestSent}
    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {sendingRequest
      ? "Sending..."
      : requestSent
      ? "Request Sent"
      : "Add Friend"}
  </button>

  {friendMessage && (
    <p className="mt-2 text-sm text-green-600">
      {friendMessage}
    </p>
  )}

  {friendError && (
    <p className="mt-2 text-sm text-red-600">
      {friendError}
    </p>
  )}
</div>

          </div>
        )}
      </div>
    </RequireRole>
  );
};

export default Page;
