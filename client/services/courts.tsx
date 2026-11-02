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
  model3dUrl: string | null;
  images: string[];
  availabilities: CourtAvailability[];
}

export interface CourtDetail extends Court {
  venue: { id: string; venueName: string; city: string };
}

export interface OwnerVenue {
  id: string;
  venueName: string;
  description: string | null;
  address: string;
  city: string;
  sizeOfVenue: string;
  images: string[];
  courtsPriceRange: string;
  isActive: boolean;
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

export async function getCourt(courtId: string): Promise<CourtDetail> {
  const response = await fetch(`${API_URL}/court/${courtId}`, {
    method: "GET",
    credentials: "include",
  });
  return parse(response);
}

// Activates or deactivates a venue together with all of its courts
export async function setVenueActive(venueId: string, isActive: boolean) {
  const response = await fetch(
    `${API_URL}/venue-application/${venueId}/active`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    },
  );
  return parse(response);
}

export async function updateCourt(courtId: string, court: CourtInput) {
  const response = await fetch(`${API_URL}/court/${courtId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(court),
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

// .glb upload — multipart/form-data, field name "file" (backend FileInterceptor se match)
export async function uploadCourtModel(courtId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/court/${courtId}/model`, {
    method: "POST",
    credentials: "include",
    body: form, // Content-Type header MAT likho — browser boundary ke saath khud lagata hai
  });
  return parse(response) as Promise<{ id: string; model3dUrl: string }>;
}

export async function removeCourtModel(courtId: string) {
  const response = await fetch(`${API_URL}/court/${courtId}/model`, {
    method: "DELETE",
    credentials: "include",
  });
  return parse(response) as Promise<{ id: string; model3dUrl: null }>;
}
// Court photos upload — field "files" (backend FilesInterceptor se match) → { urls }
export async function uploadCourtImages(courtId: string, files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const response = await fetch(`${API_URL}/court/${courtId}/images`, {
    method: "POST",
    credentials: "include",
    body: form, // Content-Type mat likho
  });
  return parse(response) as Promise<{ urls: string[] }>;
}

// Final photo list save (add / remove)
export async function setCourtImages(courtId: string, images: string[]) {
  const response = await fetch(`${API_URL}/court/${courtId}/images`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });
  return parse(response) as Promise<{ id: string; images: string[] }>;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface OwnerBooking {
  id: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;
  totalPricePKR: number;
  status: BookingStatus;
  bookingType: "SINGLE" | "SPLIT";
  createdAt: string;
  court: {
    id: string;
    courtName: string;
    sport: string;
    venue: { id: string; venueName: string };
  };
  user: { id: string; name: string | null; email: string };
}

// Owner ke venues ki bookings (read-only). Sab filters optional.
export async function getOwnerBookings(filters: {
  venueId?: string;
  date?: string;
  status?: BookingStatus;
} = {}): Promise<OwnerBooking[]> {
  const params = new URLSearchParams();
  if (filters.venueId) params.set("venueId", filters.venueId);
  if (filters.date) params.set("date", filters.date);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  const response = await fetch(`${API_URL}/court/bookings${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  return parse(response);
}
