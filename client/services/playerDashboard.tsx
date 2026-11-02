
const API = "http://localhost:3001";

// Every call sends the login cookie and throws the backend error message.
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: options.body
      ? { "Content-Type": "application/json" }
      : undefined,
    ...options,
  });

  if (!response.ok) {
    let message = "Something went wrong";

    try {
      const data = await response.json();
      message = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || message;
    } catch {}

    throw new Error(message);
  }

  return response.json();
}

export async function getPlayerData() {
  return request("/player/");
}

export function getVenues() {
  return request("/player/venues");
}

export function getVenue(venueId: string) {
  return request(`/player/venues/${venueId}`);
}

export function getCourt(courtId: string) {
  return request(`/player/courts/${courtId}`);
}

export function getSlots(courtId: string, date: string) {
  return request(
    `/player/courts/${courtId}/slots?date=${encodeURIComponent(date)}`
  );
}

// Existing single booking — unchanged.
export function createBooking(body: {
  courtId: string;
  date: string;
  startTime: string;
}) {
  return request("/player/bookings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// New split booking.
export function createSplitBooking(body: {
  courtId: string;
  date: string;
  startTime: string;
  invitedUserIds: string[];
}) {
  return request("/player/bookings/split", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Existing checkout functions.
export function getBooking(id: string) {
  return request(`/player/bookings/${id}`);
}

export function confirmBooking(id: string) {
  return request(`/player/bookings/${id}/confirm`, {
    method: "POST",
  });
}

export function getHeldBookings() {
  return request("/player/bookings/held");
}

// Get the logged-in player's accepted friends.
export function getAcceptedFriends() {
  return request("/friends/accepted");
}

// Get split invitations received by the logged-in player.
export function getSplitInvitations() {
  return request("/player/bookings/invitations");
}

// Accept a split invitation.
export function acceptSplitInvitation(bookingId: string) {
  return request(`/player/bookings/${bookingId}/accept-invitation`, {
    method: "POST",
  });
}

// Decline a split invitation.
export function declineSplitInvitation(bookingId: string) {
  return request(`/player/bookings/${bookingId}/decline-invitation`, {
    method: "POST",
  });
}

// Record a participant's payment confirmation.
// This is a development placeholder, not a real payment gateway.
export function confirmSplitPayment(bookingId: string) {
  return request(`/player/bookings/${bookingId}/pay`, {
    method: "POST",
  });
}
