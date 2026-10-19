export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";

export interface PlayerProfile {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  profilePicture: string | null;
  city: string | null;
  skillLevel: SkillLevel | null;
  availability: string | null;
  preferredSports: string[];
  isProfileComplete: boolean;
}

export type UpdateProfileInput = Partial<
  Omit<PlayerProfile, "id" | "userId" | "isProfileComplete"> // Omit ka matlab hai existing type se kuch fields hata dena., ||  Partial baqi tamam fields ko optional bana deta hai.
>;

const BASE = "http://localhost:3001/player-profile";

export async function getProfile(): Promise<{ profile: PlayerProfile | null }> {
  const response = await fetch(BASE, { method: "GET", credentials: "include" });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Failed to fetch profile");
  return data;
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ profile: PlayerProfile }> {
  const response = await fetch(BASE, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Failed to update profile";
    throw new Error(message);
  }
  return data;
}