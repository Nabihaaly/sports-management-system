
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
        <div className="page-narrow space-y-4" aria-busy="true">
          <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-mist" />
          <div className="h-80 animate-pulse rounded-3xl bg-mist" />
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole role="PLAYER">
      <div className="page-narrow">

        {/* Profile Heading */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Player</p>
            <h1 className="page-title mt-1">
              My profile
            </h1>
          </div>

          <a
            href="/dashboard"
            className="btn-ghost -mr-4 shrink-0"
          >
            ← Back to venues
          </a>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {editing ? (

          /* EDIT PROFILE SECTION */
          <div className="card p-6 sm:p-8">

            <p className="eyebrow">{profile ? "Edit" : "Get started"}</p>
            <h2 className="section-title mb-6 mt-1">
              {profile ? "Edit profile" : "Build your player profile"}
            </h2>

            <form onSubmit={handleSave} className="space-y-5">

              <div>
                <label className="label" htmlFor="profile-displayName">
                  Display name *
                </label>

                <input
                  id="profile-displayName"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  placeholder="Your display name"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="profile-city">
                  Home city *
                </label>

                <input
                  id="profile-city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="Karachi"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="profile-skillLevel">
                  Skill level
                </label>

                <select
                  id="profile-skillLevel"
                  value={form.skillLevel}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      skillLevel: e.target.value as SkillLevel | "",
                    }))
                  }
                  className="input"
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
                <p className="label">Profile photo</p>
                <div className="rounded-2xl border border-dashed border-line bg-mist/40 p-4">
                  {profile ? (
                    <div className="flex flex-wrap items-center gap-4">
                      {profile.profilePicture ? (
                        <img
                          src={profile.profilePicture}
                          alt="Profile"
                          className="h-20 w-20 rounded-full object-cover ring-4 ring-lime"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest font-heading text-2xl font-black text-lime ring-4 ring-lime">
                          {profile.displayName?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <label className="btn-outline cursor-pointer">
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
                          className="btn-ghost text-danger hover:bg-danger-soft hover:text-danger"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      Save your profile first, then you can add a photo.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted">JPG, PNG or WebP · max 5 MB</p>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="profile-bio">
                  Bio
                </label>

                <textarea
                  id="profile-bio"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  maxLength={300}
                  placeholder="Tell other players about yourself..."
                  className="input"
                  rows={4}
                />
              </div>

              <div>
                <p className="label">
                  Preferred sports
                </p>

                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((sport) => (
                    <button
                      type="button"
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      aria-pressed={form.preferredSports.includes(sport)}
                      className={`${
                        form.preferredSports.includes(sport)
                          ? "chip-active"
                          : "chip hover:border-ink"
                      } px-4 py-1.5 text-sm transition`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-line bg-mist/40 p-4">
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
                  className="mt-1 h-5 w-5 cursor-pointer accent-ink"
                />

                <div>
                  <label
                    htmlFor="availableForMatching"
                    className="cursor-pointer font-semibold text-ink"
                  >
                    Available for matching
                  </label>

                  <p className="mt-1 text-sm text-muted">
                    Allow other players to find and match with you.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                {profile && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-outline w-full"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>

              </div>
            </form>
          </div>

        ) : (

          /* PROFILE VIEW SECTION */
          <div className="space-y-5">

            {/* Profile Top Section */}
            <div className="card p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

                {/* Profile Picture */}
                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.displayName}
                    className="h-32 w-32 shrink-0 rounded-full object-cover ring-4 ring-lime"
                  />
                ) : (
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-forest font-heading text-5xl font-black text-lime ring-4 ring-lime">
                    {profile?.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}

                {/* Profile Information */}
                <div className="flex-1 text-center sm:text-left">

                  <p className="eyebrow">Player card</p>

                  <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-4xl">
                      {profile?.displayName}
                    </h2>

                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="btn-outline shrink-0"
                    >
                      Edit profile
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {profile?.city && (
                      <span className="chip">{profile.city}</span>
                    )}
                    {profile?.skillLevel && (
                      <span className="chip-active">{profile.skillLevel}</span>
                    )}
                    <span
                      className={
                        profile?.availableForMatching
                          ? "badge-success"
                          : "badge-warning"
                      }
                    >
                      {profile?.availableForMatching
                        ? "Available for matching"
                        : "Not available for matching"}
                    </span>
                  </div>

                  {profile?.bio && (
                    <p className="mt-5 whitespace-pre-wrap text-sm text-ink">
                      {profile.bio}
                    </p>
                  )}

                </div>
              </div>
            </div>

            {/* Player Details */}
            <div className="grid gap-4 sm:grid-cols-2">

              <div className="card-dark">
                <p className="eyebrow text-lime">Skill level</p>
                <p className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
                  {profile?.skillLevel || "Not set"}
                </p>
              </div>

              <div className="card-dark">
                <p className="eyebrow text-lime">Player matching</p>
                <p className="mt-2 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
                  {profile?.availableForMatching ? "Open" : "Closed"}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {profile?.availableForMatching
                    ? "Available for matching"
                    : "Not available for matching"}
                </p>
              </div>

            </div>

            <div className="card p-6">
              <h3 className="eyebrow">
                Preferred sports
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile?.preferredSports?.length ? (
                  profile.preferredSports.map((sport) => (
                    <span
                      key={sport}
                      className="chip-active"
                    >
                      {sport}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    No preferred sports added yet.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </RequireRole>
  );
};

export default Page;
