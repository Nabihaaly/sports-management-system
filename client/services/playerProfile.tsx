
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

  
const FRIENDS_BASE = "http://localhost:3001/friends";

export async function sendFriendRequest(profileId: string) {
  const response = await fetch(
    `${FRIENDS_BASE}/request/${encodeURIComponent(profileId)}`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to send friend request"
    );
  }

  return data;
}


export interface ReceivedFriendRequest {
  id: string;
  senderId: string;
  createdAt: string;
  sender: {
    name: string;
    playerProfile: {
      displayName: string;
      profilePicture: string | null;
      city: string;
    } | null;
  };
}
export async function getReceivedFriendRequests(): Promise<{
  requests: ReceivedFriendRequest[];
}> {
  const response = await fetch(
    `${FRIENDS_BASE}/requests/received`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch friend requests");
  }

  return data;
}

export async function acceptFriendRequest(requestId: string) {
  const response = await fetch(
    `${FRIENDS_BASE}/${encodeURIComponent(requestId)}/accept`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to accept friend request");
  }

  return data;
}

export async function declineFriendRequest(requestId: string) {
  const response = await fetch(
    `${FRIENDS_BASE}/${encodeURIComponent(requestId)}/reject`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to decline friend request");
  }

  return data;
}
// Picture upload — multipart; Content-Type header MAT likho, browser boundary ke saath khud lagata hai
export async function uploadProfilePicture(
  file: File,
): Promise<{ profile: PlayerProfile }> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${BASE}/picture`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Upload failed");
  return data;
}

export async function removeProfilePicture(): Promise<{ profile: PlayerProfile | null }> {
  const response = await fetch(`${BASE}/picture`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Failed");
  return data;
}
