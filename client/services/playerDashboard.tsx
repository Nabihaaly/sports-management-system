export async function getPlayerData(){
    try {
    const response = await fetch(
      "http://localhost:3001/student/",
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get Player Data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting Player Data:", error);
    throw error;
  }

    
}