export async function getCurrentUser() {
  try {
    const response = await fetch(
      "http://localhost:3001/auth/",
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get current user");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting current user:", error);
    throw error;
  }
}