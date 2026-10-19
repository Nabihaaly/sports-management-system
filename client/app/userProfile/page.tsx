"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getProfile,
  updateProfile,
  SkillLevel,
} from "../../services/playerProfile";
import RequireRole from "@/Components/RequireRole";

const SKILL_LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];
const SPORTS = ["Padel", "Futsal", "Tennis", "Cricket", "Badminton", "Pickleball"];

const Page = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    city: "",
    skillLevel: "" as SkillLevel | "",
    availability: "",
    bio: "",
    profilePicture: "",
    preferredSports: [] as string[],
  });
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
          availability: profile.availability ?? "",
          bio: profile.bio ?? "",
          profilePicture: profile.profilePicture ?? "",
          preferredSports: profile.preferredSports ?? [],
        });
      })
      .catch(() => { })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleSport = (sport: string) => {
    setForm((f) => ({
      ...f,
      preferredSports: f.preferredSports.includes(sport)
        ? f.preferredSports.filter((s) => s !== sport)
        : [...f.preferredSports, sport],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Khali strings na bhejo — DTO optional fields ko undefined chahiye
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) =>
          Array.isArray(v) ? v.length > 0 : v !== "",
        ),
      );
      await updateProfile(payload);
      toast.success("Profile saved");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading profile...</p>;

  return (
    <RequireRole role="PLAYER">

      <div>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Build your player card</h2>
            <p className="text-sm text-gray-600 mb-4">
              Level, style, availability — the better we know you, the better we match you.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">Display name</label>
                <input name="displayName" value={form.displayName} onChange={handleChange}
                  placeholder="Alex Rivera" className="w-full border rounded-md p-2" />
              </div>

              <div>
                <label className="block mb-1">Home city</label>
                <input name="city" value={form.city} onChange={handleChange}
                  placeholder="Karachi" className="w-full border rounded-md p-2" />
              </div>

              <div>
                <label className="block mb-1">Skill level</label>
                <select name="skillLevel" value={form.skillLevel} onChange={handleChange}
                  className="w-full border rounded-md p-2">
                  <option value="">Select</option>
                  {SKILL_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1">Availability</label>
                <input name="availability" value={form.availability} onChange={handleChange}
                  placeholder="Weekday evenings" className="w-full border rounded-md p-2" />
              </div>

              <div>
                <label className="block mb-1">Preferred sports</label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((sport) => (
                    <button type="button" key={sport} onClick={() => toggleSport(sport)}
                      className={`border rounded-full px-3 py-1 ${form.preferredSports.includes(sport) ? "bg-black text-white" : ""
                        }`}>
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1">Profile photo URL</label>
                <input name="profilePicture" value={form.profilePicture} onChange={handleChange}
                  placeholder="https://..." className="w-full border rounded-md p-2" />
              </div>

              <div>
                <label className="block mb-1">Bio</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} maxLength={300}
                  placeholder="A line or two about your game." className="w-full border rounded-md p-2" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/dashboard")}
              className="w-full border rounded-md p-3">
              Skip for now
            </button>
            <button type="submit" disabled={saving}
              className="w-full bg-black text-white rounded-md p-3 disabled:opacity-50">
              {saving ? "Saving..." : "Save & start playing"}
            </button>
          </div>
        </form>
      </div>
    </RequireRole>
  );
};

export default Page;