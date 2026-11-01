
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import RequireRole from "@/Components/RequireRole";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          availableForMatching:
            profile.availableForMatching ?? false,
          bio: profile.bio ?? "",
          preferredSports: profile.preferredSports ?? [],
        });
        setProfilePicture(profile.profilePicture);
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

  // Picture upload turant hota hai — Save ka wait nahi
  const handlePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB} MB`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const { profile } = await uploadProfilePicture(file);
      setProfilePicture(profile.profilePicture);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // same file dobara choose ho sake
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      await removeProfilePicture();
      setProfilePicture(null);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
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

        ...(form.skillLevel && {
          skillLevel: form.skillLevel,
        }),

        ...(form.bio.trim() && {
          bio: form.bio.trim(),
        }),

        ...(form.profilePicture.trim() && {
          profilePicture: form.profilePicture.trim(),
        }),
      };

      await updateProfile(payload);

      toast.success("Profile saved");

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  // Skip profile setup and go to dashboard
  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return <p className="text-center mt-20">Loading profile...</p>;
  }

  return (
    <RequireRole role="PLAYER">
      <div>
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div>
            <h2 className="text-xl font-semibold mb-1">
              Build your player card
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Level, sports and matching preferences — the better we know
              you, the better we can match you.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">
                  Display name <span className="text-red-500">*</span>
                </label>

                <input
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Alex Rivera"
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Home city <span className="text-red-500">*</span>
                </label>

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Karachi"
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Skill level
                </label>

                <select
                  name="skillLevel"
                  value={form.skillLevel}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select</option>

                  {SKILL_LEVELS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available for matching checkbox */}
              <div className="flex items-center gap-3 border rounded-md p-4">
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
                  className="h-5 w-5 cursor-pointer accent-black"
                />

                <div>
                  <label
                    htmlFor="availableForMatching"
                    className="font-medium cursor-pointer"
                  >
                    Available for matching
                  </label>

                  <p className="text-sm text-gray-500 mt-1">
                    Allow other players to find and match with you.
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  Preferred sports
                </label>

                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((sport) => (
                    <button
                      type="button"
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`border rounded-full px-3 py-1 ${
                        form.preferredSports.includes(sport)
                          ? "bg-black text-white"
                          : ""
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>

              <div>
                <label className="block mb-1">
                  Profile photo URL
                </label>

                <input
                  name="profilePicture"
                  value={form.profilePicture}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>

              <div>
                <label className="block mb-1">
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  maxLength={300}
                  placeholder="A line or two about your game."
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="w-full border rounded-md p-3"
            >
              Skip for now
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-black text-white rounded-md p-3 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & start playing"}
            </button>
          </div>
        </form>
      </div>
    </RequireRole>
  );
};

export default Page;
