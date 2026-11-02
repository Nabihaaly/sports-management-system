"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  SkillLevel,
} from "../../services/playerProfile";
import RequireRole from "@/Components/RequireRole";

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

const MAX_IMAGE_MB = 5;

const Page = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    displayName: "",
    city: "",
    skillLevel: "" as SkillLevel | "",
    availableForMatching: false,
    bio: "",
    preferredSports: [] as string[],
  });

  // Photo: Save se pehle sirf local preview, upload Save ke saath hota hai
  // (profile row tab tak nahi hoti, backend upload reject karega)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Prefill existing profile
  useEffect(() => {
    let cancelled = false;

    getProfile()
      .then(({ profile }) => {
        if (cancelled || !profile) return;

        setForm({
          displayName: profile.displayName ?? "",
          city: profile.city ?? "",
          skillLevel: profile.skillLevel ?? "",
          availableForMatching: profile.availableForMatching ?? false,
          bio: profile.bio ?? "",
          preferredSports: profile.preferredSports ?? [],
        });
        setPhotoPreview(profile.profilePicture);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleSport = (sport: string) => {
    setForm((prev) => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sport)
        ? prev.preferredSports.filter((s) => s !== sport)
        : [...prev.preferredSports, sport],
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB} MB`);
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoClear = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        ...(form.skillLevel && { skillLevel: form.skillLevel }),
        ...(form.bio.trim() && { bio: form.bio.trim() }),
      };

      // 1. Profile save (create ya update)
      await updateProfile(payload);

      // 2. Photo chuni thi to ab upload — profile row ab exist karti hai
      if (photoFile) {
        try {
          await uploadProfilePicture(photoFile);
        } catch {
          toast.error(
            "Profile saved, but the photo upload failed. You can add it from your profile.",
          );
        }
      }

      toast.success("Profile saved");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Skip profile setup and go to dashboard
  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="page-narrow max-w-2xl space-y-4" aria-busy="true">
        <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-mist" />
        <div className="h-96 animate-pulse rounded-3xl bg-mist" />
      </div>
    );
  }

  return (
    <RequireRole role="PLAYER">
      <div className="page-narrow max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="eyebrow">Step 2 of 2</p>
            <h2 className="page-title mt-1 mb-2">Build your player card</h2>

            <p className="mb-8 max-w-md text-sm text-muted">
              Level, sports and matching preferences — the better we know you,
              the better we can match you.
            </p>

            <div className="card space-y-5 p-6 sm:p-8">
              {/* Profile photo (optional) */}
              <div>
                <p className="label">
                  Profile photo <span className="font-normal normal-case tracking-normal text-muted/70">(optional)</span>
                </p>
                <div className="rounded-2xl border border-dashed border-line bg-mist/40 p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover ring-4 ring-lime"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest font-heading text-xl font-black text-lime ring-4 ring-lime">
                        {form.displayName.trim().charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <label className="btn-outline cursor-pointer">
                      {photoFile ? "Change photo" : "Choose photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={handlePhotoClear}
                        className="btn-ghost text-danger hover:bg-danger-soft hover:text-danger"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Uploaded when you save · JPG, PNG or WebP · max {MAX_IMAGE_MB} MB
                  </p>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="onboarding-displayName">
                  Display name <span className="text-danger">*</span>
                </label>
                <input
                  id="onboarding-displayName"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Alex Rivera"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="onboarding-city">
                  Home city <span className="text-danger">*</span>
                </label>
                <input
                  id="onboarding-city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Karachi"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="onboarding-skillLevel">Skill level</label>
                <select
                  id="onboarding-skillLevel"
                  name="skillLevel"
                  value={form.skillLevel}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select</option>
                  {SKILL_LEVELS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available for matching */}
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

              <div>
                <p className="label">Preferred sports</p>
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

              <div>
                <label className="label" htmlFor="onboarding-bio">Bio</label>
                <textarea
                  id="onboarding-bio"
                  rows={4}
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  maxLength={300}
                  placeholder="A line or two about your game."
                  className="input"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSkip}
              className="btn-outline w-full"
            >
              Skip for now
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? "Saving..." : "Save & start playing →"}
            </button>
          </div>
        </form>
      </div>
    </RequireRole>
  );
};

export default Page;
