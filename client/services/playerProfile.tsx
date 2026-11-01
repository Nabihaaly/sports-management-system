
export type SkillLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "PRO";

export interface PlayerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  profilePicture: string | null;
  city: string;
  skillLevel: SkillLevel | null;
  availableForMatching: boolean;
  preferredSports: string[];
  isProfileComplete: boolean;
}

export interface PlayerSearchResult {
  id: string;
  displayName: string;
  city: string;
  profilePicture: string | null;
  skillLevel: SkillLevel | null;
  preferredSports: string[];
  availableForMatching: boolean;
}

export type UpdateProfileInput = Partial<
  Omit<PlayerProfile, "id" | "userId" | "isProfileComplete">
>;

const BASE = "http://localhost:3001/player-profile";

// Get logged-in player's own profile
export async function getProfile(): Promise<{
  profile: PlayerProfile | null;
}> {
  const response = await fetch(BASE, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch profile");
  }

  return data;
}

// Create or update logged-in player's profile
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ profile: PlayerProfile }> {
  const response = await fetch(BASE, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
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

// Search other players by their display name
export async function searchPlayers(
  name: string,
): Promise<{ players: PlayerSearchResult[] }> {
  const response = await fetch(
    `${BASE}/search?name=${encodeURIComponent(name)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to search players");
  }

  return data;
}

export interface PublicPlayerProfile {
  id: string;
  displayName: string;
  city: string;
  bio: string | null;
  profilePicture: string | null;
  skillLevel: SkillLevel | null;
  preferredSports: string[];
  availableForMatching: boolean;
}

// Get another player's public profile
export async function getPublicProfile(
  profileId: string,
): Promise<{ profile: PublicPlayerProfile }> {
  const response = await fetch(
    `${BASE}/${encodeURIComponent(profileId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to fetch player profile",
    );
  }

  return data;
}