export interface VenueOwnerInput {
  fullName: string;
  cnic: string;
  phoneNumber: string;
}

export interface VenueDetailsInput {
  venueName: string;
  description: string;
  address: string;
  city: string;
  images: string[];
  businessRegistration: string;
  sizeOfVenue: string;
  courtsPriceRange: string;
}

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
// Purane imports (Navbar, applicationStatus page) ke liye alias
export type OwnerStatus = ApplicationStatus;

// Backend ka effective status:
//   null → application nahi, APPROVED → owner verified (koi ek venue approved),
//   PENDING / REJECTED → sabse naye venue ka status
export async function getApplicationStatus(): Promise<{
  status: ApplicationStatus | null;
}> {
  const response = await fetch("http://localhost:3001/venue-application/status", {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch status");
  }

  return data;
}

export async function createApplication(
  venueOwner: VenueOwnerInput,
  venueDetails: VenueDetailsInput,
) {
  const response = await fetch("http://localhost:3001/venue-application", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ venueOwner, venueDetails }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Failed to submit application";
    throw new Error(message);
  }

  return data;
}