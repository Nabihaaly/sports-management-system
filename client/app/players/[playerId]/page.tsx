
"use client";

import RequireRole from "@/Components/RequireRole";
import {
  getPublicProfile,
  PublicPlayerProfile,
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

  return (
    <RequireRole role="PLAYER">
      <div className="mx-auto max-w-3xl p-6">

        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm text-gray-600 hover:text-black"
        >
          ← Back to Venues
        </Link>

        {loading && <p>Loading profile...</p>}

        {error && (
          <p className="text-red-600">{error}</p>
        )}

        {!loading && !error && profile && (
          <div className="rounded-xl border bg-white p-6">

            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">

              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.displayName}
                  className="h-28 w-28 rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-200 text-4xl font-semibold">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold">
                  {profile.displayName}
                </h1>

                <p className="mt-1 text-gray-500">
                  {profile.city}
                </p>

                <p
                  className={`mt-3 text-sm font-medium ${
                    profile.availableForMatching
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {profile.availableForMatching
                    ? "Available for matching"
                    : "Not available for matching"}
                </p>
              </div>
            </div>

            <hr className="my-6" />

            {/* Bio */}
            <div className="mb-5">
              <h2 className="mb-2 font-semibold">About</h2>
              <p className="text-gray-600">
                {profile.bio || "No bio added yet."}
              </p>
            </div>

            {/* Skill Level */}
            <div className="mb-5">
              <h2 className="mb-2 font-semibold">
                Skill Level
              </h2>
              <p className="text-gray-600">
                {profile.skillLevel || "Not specified"}
              </p>
            </div>

            {/* Preferred Sports */}
            <div>
              <h2 className="mb-2 font-semibold">
                Preferred Sports
              </h2>

              {profile.preferredSports.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferredSports.map((sport) => (
                    <span
                      key={sport}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No preferred sports added.
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
