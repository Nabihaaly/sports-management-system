export type OwnerStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VenueApplication {
  id: string;
  venueName: string;
  description: string | null;
  address: string;
  city: string;
  sizeOfVenue: string;
  courtsPriceRange: string;
  businessRegistration: string;
  status: OwnerStatus;
  createdAt: string;
  venueOwner: {
    id: string;
    fullName: string;
    cnic: string;
    phoneNumber: string;
    user: { id: string; name: string; email: string };
  };
}

const BASE = "http://localhost:3001/admin/venue-applications";

export async function listApplications(status?: OwnerStatus) {
  const url = status ? `${BASE}?status=${status}` : BASE;
  const response = await fetch(url, { credentials: "include" });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Failed to load applications");
  return data as { applications: VenueApplication[] };
}

export async function reviewApplication(id: string, status: "APPROVED" | "REJECTED") {
  const response = await fetch(`${BASE}/${id}/review`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(message || "Failed to update application");
  }
  return data;
}