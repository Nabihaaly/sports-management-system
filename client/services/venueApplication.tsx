export async function createApplication(venueOwner: object,venueDetails: object) {
  try {
    const response = await fetch("http://localhost:4380/auth/setRole", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        venueOwner: venueOwner,
        venueDetails: venueDetails
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error updating player:", error);
    throw error;
  }
}
