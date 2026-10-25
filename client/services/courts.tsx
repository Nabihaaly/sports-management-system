const API_URL = "http://localhost:3001";

export type CourtType = "INDOOR" | "OUTDOOR";

export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface CourtAvailability {
  id?: string;
  dayOfWeek: WeekDay;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isActive?: boolean;
}

export interface CourtInput {
  venueId: string;
  courtName: string;
  sport: string;
  courtType: CourtType;
  maxPlayers: number;
  bookingDurationMinutes: number;
  description?: string;
  pricePerSlotPKR: number;
  openingTime: string;
  closingTime: string;
  operatingDays: WeekDay[];
  isActive: boolean;
  availabilities?: CourtAvailability[];
}

export interface Court {
  id: string;
  venueId: string;
  courtName: string;
  sport: string;
  courtType: CourtType;
  maxPlayers: number;
  bookingDurationMinutes: number;
  description: string | null;
  pricePerSlotPKR: number;
  openingTime: string;
  closingTime: string;
  operatingDays: WeekDay[];
  isActive: boolean;
  availabilities: CourtAvailability[];
}

export interface OwnerVenue {
  id: string;
  venueName: string;
  description: string | null;
  address: string;
  city: string;
  sizeOfVenue: string;
  courtsPriceRange: string;
  courts: Court[];
}

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

export async function getMyVenues(): Promise<OwnerVenue[]> {
  const response = await fetch(`${API_URL}/court/venues`, {
    method: "GET",
    credentials: "include",
  });
  return parse(response);
}

export async function createCourt(court: CourtInput) {
  const response = await fetch(`${API_URL}/court`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(court),
  });
  return parse(response);
}