const API = "http://localhost:3001";

export interface PlayerMatch {
  userId: string;
  profileId: string;
  displayName: string;
  profilePicture: string | null;
  city: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO" | null;
  requestId: string;
  budget: number;
  availableFrom: string;
  availableUntil: string;
  overlapFrom: string;
  overlapUntil: string;
  overlapMinutes: number;
  score: number; // 0-100
  breakdown: { time: number; skill: number; budget: number };
  reasons: string[]; // card pe dikhane ke liye, e.g. "Same skill level (Intermediate)"
}

export interface MatchesResponse {
  myRequest: { id: string; preferredSport: string; availableFrom: string; availableUntil: string; budget: number };
  court: null | {
    id: string; courtName: string; sport: string; venueName: string; city: string;
    pricePerSlotPKR: number; maxPlayers: number; bookingDurationMinutes: number; perPlayerSharePKR: number;
  };
  criteria: { sport: string; city: string; minOverlapMinutes: number };
  count: number;
  matches: PlayerMatch[];
}

// "Match with players": courtId do to court ke hisaab se (Book a court page), na do to sirf request ke hisaab se.
export async function getPlayerMatches(params: { courtId?: string; requestId?: string; limit?: number } = {}): Promise<MatchesResponse> {
  const qs = new URLSearchParams();
  if (params.courtId) qs.set("courtId", params.courtId);
  if (params.requestId) qs.set("requestId", params.requestId);
  if (params.limit) qs.set("limit", String(params.limit));

  const response = await fetch(`${API}/player-matching/matches?${qs}`, { credentials: "include" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(msg || "Failed to load matches");
  }
  return data;
}
