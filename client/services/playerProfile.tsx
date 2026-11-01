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

// PATCH body — profilePicture nahi, wo upload endpoint se set hoti hai
export type UpdateProfileInput = Partial<
  Omit<PlayerProfile, "id" | "userId" | "isProfileComplete" | "profilePicture">
>;

const BASE = "http://localhost:3001/player-profile";

async function parse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function getProfile(): Promise<{ profile: PlayerProfile | null }> {
  const response = await fetch(BASE, { method: "GET", credentials: "include" });
  return parse(response);
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
  return parse(response);
}

// multipart — Content-Type header MAT likho, browser boundary ke saath khud lagata hai
export async function uploadProfilePicture(file: File): Promise<{ profile: PlayerProfile }> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${BASE}/picture`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return parse(response);
}

export async function removeProfilePicture(): Promise<{ profile: PlayerProfile | null }> {
  const response = await fetch(`${BASE}/picture`, {
    method: "DELETE",
    credentials: "include",
  });
  return parse(response);
}