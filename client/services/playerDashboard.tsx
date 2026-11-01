const API = "http://localhost:3001";

// small helper: every call sends the login cookie and throws the backend's error message
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });

  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const data = await response.json();
      message = Array.isArray(data.message) ? data.message.join(", ") : data.message || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

// (your existing function, unchanged behaviour)
export async function getPlayerData() {
  return request("/player/");
}

// page 1: venues list
export function getVenues() {
  return request("/player/venues");
}

// page 2: venue details + courts
export function getVenue(venueId: string) {
  return request(`/player/venues/${venueId}`);
}

// page 3: one court with all its details
export function getCourt(courtId: string) {
  return request(`/player/courts/${courtId}`);
}

// page 3: slots of a court on a date (YYYY-MM-DD)
export function getSlots(courtId: string, date: string) {
  return request(`/player/courts/${courtId}/slots?date=${date}`);
}

export function createBooking(body: { courtId: string; date: string; startTime: string }) {
  return request("/player/bookings", { method: "POST", body: JSON.stringify(body) });
}

// page 4: checkout
export function getBooking(id: string) {
  return request(`/player/bookings/${id}`);
}

export function confirmBooking(id: string) {
  return request(`/player/bookings/${id}/confirm`, {
    method: "POST",
  });

  
}

// Get all active slots held by the logged-in player
export function getHeldBookings() {
  return request("/player/bookings/held");
}