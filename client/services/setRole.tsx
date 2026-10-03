export async function updateRole(role: string) {
  try {
    const response = await fetch("http://localhost:3001/auth/setRole", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: role,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error updating player:", error);
    throw error;
  }
}
