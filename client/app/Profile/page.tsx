
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RequireRole from "@/Components/RequireRole";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  PlayerProfile,
  SkillLevel,
} from "../../services/playerProfile";

const SKILL_LEVELS: SkillLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "PRO",
];

const SPORTS = [
  "Padel",
  "Futsal",
  "Tennis",
  "Cricket",
  "Badminton",
  "Pickleball",
];

type ProfileForm = {
  displayName: string;
  city: string;
  skillLevel: SkillLevel | "";
  availableForMatching: boolean;
  bio: string;
  preferredSports: string[];
};

const emptyForm: ProfileForm = {
  displayName: "",
  city: "",
  skillLevel: "",
  availableForMatching: false,
  bio: "",
  preferredSports: [],
};

const Page = () => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);

  // Fetch logged-in player's profile
  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        setProfile(profile);

        if (profile) {
          setForm({
            displayName: profile.displayName ?? "",
            city: profile.city ?? "",
            skillLevel: profile.skillLevel ?? "",
            availableForMatching:
              profile.availableForMatching ?? false,
            bio: profile.bio ?? "",
            preferredSports: profile.preferredSports ?? [],
          });
        } else {
          // If the player skipped setup, allow them to create it here.
          setEditing(true);
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load profile"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSport = (sport: string) => {
    setForm((prev) => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sport)
        ? prev.preferredSports.filter((s) => s !== sport)
        : [...prev.preferredSports, sport],
    }));
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        city: profile.city ?? "",
        skillLevel: profile.skillLevel ?? "",
        availableForMatching:
          profile.availableForMatching ?? false,
        bio: profile.bio ?? "",
        preferredSports: profile.preferredSports ?? [],
      });
    } else {
      setForm(emptyForm);
    }

    setError("");
    setEditing(false);
  };


  // Photo turant upload — Save se alag
  const handlePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const { profile: updated } = await uploadProfilePicture(file);
      setProfile(updated);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      const { profile: updated } = await removeProfilePicture();
      setProfile(updated);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.displayName.trim() || !form.city.trim()) {
      setError("Display name and home city are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        displayName: form.displayName.trim(),
        city: form.city.trim(),
        availableForMatching: form.availableForMatching,
        preferredSports: form.preferredSports,

        ...(form.skillLevel && {
          skillLevel: form.skillLevel,
        }),

        ...(form.bio.trim() && {
          bio: form.bio.trim(),
        }),

      };

      const response = await updateProfile(payload);

      setProfile(response.profile);

      setForm({
        displayName: response.profile.displayName ?? "",
        city: response.profile.city ?? "",
        skillLevel: response.profile.skillLevel ?? "",
        availableForMatching:
          response.profile.availableForMatching ?? false,
        bio: response.profile.bio ?? "",
        preferredSports: response.profile.preferredSports ?? [],
      });

      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RequireRole role="PLAYER">
        <p className="mt-20 text-center">Loading profile...</p>
      </RequireRole>
    );
  }

  return (
    <RequireRole role="PLAYER">
      <div className="min-h-screen bg-gray-50 px-4 py-8">

        <div className="mx-auto max-w-3xl">

          {/* Profile Heading */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              My Profile
            </h1>

            <a
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-black"
            >
              Back to venues
            </a>
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {editing ? (

            /* EDIT PROFILE SECTION */
            <div className="rounded-xl border bg-white p-6 shadow-sm">

              <h2 className="mb-6 text-xl font-semibold">
                {profile ? "Edit Profile" : "Build your player profile"}
              </h2>

              <form onSubmit={handleSave} className="space-y-5">

                <div>
                  <label className="mb-1 block font-medium">
                    Display name *
                  </label>

                  <input
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Your display name"
                    required
                    className="w-full rounded-md border p-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Home city *
                  </label>

                  <input
                    value={form.city}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Karachi"
                    required
                    className="w-full rounded-md border p-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Skill level
                  </label>

                  <select
                    value={form.skillLevel}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        skillLevel: e.target.value as SkillLevel | "",
                      }))
                    }
                    className="w-full rounded-md border p-3"
                  >
                    <option value="">Select skill level</option>

                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                                <div>
                  <label className="mb-1 block font-medium">Profile photo</label>
                  {profile ? (
                    <div className="flex items-center gap-4">
                      {profile.profilePicture ? (
                        <img
                          src={profile.profilePicture}
                          alt="Profile"
                          className="h-20 w-20 rounded-full border object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600">
                          {profile.displayName?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <label className="cursor-pointer rounded-md border px-4 py-2 text-sm hover:bg-gray-100">
                        {uploading ? "Uploading..." : profile.profilePicture ? "Change photo" : "Upload photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePicture}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      {profile.profilePicture && (
                        <button
                          type="button"
                          onClick={handleRemovePicture}
                          className="text-sm text-red-600 underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Save your profile first, then you can add a photo.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG or WebP · max 5 MB</p>
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Bio
                  </label>

                  <textarea
                    value={form.bio}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    maxLength={300}
                    placeholder="Tell other players about yourself..."
                    className="w-full rounded-md border p-3"
                    rows={4}
                  />
                </div>

                <div>
                  <p className="mb-2 font-medium">
                    Preferred sports
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map((sport) => (
                      <button
                        type="button"
                        key={sport}
                        onClick={() => toggleSport(sport)}
                        className={`rounded-full border px-4 py-2 text-sm ${
                          form.preferredSports.includes(sport)
                            ? "border-black bg-black text-white"
                            : "bg-white hover:bg-gray-100"
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <input
                    type="checkbox"
                    id="availableForMatching"
                    checked={form.availableForMatching}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        availableForMatching: e.target.checked,
                      }))
                    }
                    className="mt-1 h-5 w-5 accent-black"
                  />

                  <div>
                    <label
                      htmlFor="availableForMatching"
                      className="cursor-pointer font-medium"
                    >
                      Available for matching
                    </label>

                    <p className="mt-1 text-sm text-gray-500">
                      Allow other players to find and match with you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">

                  {profile && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full rounded-md border p-3"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-md bg-black p-3 text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>

                </div>
              </form>
            </div>

          ) : (

            /* PROFILE VIEW SECTION */
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

              {/* Profile Top Section */}
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">

                {/* Profile Picture */}
                <div className="flex justify-center sm:w-1/3">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.displayName}
                      className="h-32 w-32 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-4xl font-bold text-gray-600">
                      {profile?.displayName?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Profile Information */}
                <div className="flex-1 text-center sm:text-left">

                  <div className="mb-3 flex flex-col items-center gap-3 sm:flex-row">
                    <h2 className="text-2xl font-semibold">
                      {profile?.displayName}
                    </h2>

                    <button
                      onClick={() => setEditing(true)}
                      className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                      Edit Profile
                    </button>
                  </div>

                  <p className="text-gray-600">
                    {profile?.city}
                  </p>

                  {profile?.bio && (
                    <p className="mt-3 whitespace-pre-wrap text-sm">
                      {profile.bio}
                    </p>
                  )}

                </div>
              </div>

              <div className="border-t" />

              {/* Player Details */}
              <div className="space-y-6 p-6">

                <div>
                  <h3 className="mb-2 font-semibold">
                    Skill Level
                  </h3>

                  <span className="inline-block rounded-full bg-gray-100 px-4 py-2 text-sm">
                    {profile?.skillLevel || "Not specified"}
                  </span>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">
                    Preferred Sports
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {profile?.preferredSports?.length ? (
                      profile.preferredSports.map((sport) => (
                        <span
                          key={sport}
                          className="rounded-full bg-gray-100 px-4 py-2 text-sm"
                        >
                          {sport}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No preferred sports added yet.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">
                    Player Matching
                  </h3>

                  <span
                    className={`inline-block rounded-full px-4 py-2 text-sm ${
                      profile?.availableForMatching
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {profile?.availableForMatching
                      ? "Available for matching"
                      : "Not available for matching"}
                  </span>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </RequireRole>
  );
};

export default Page;
