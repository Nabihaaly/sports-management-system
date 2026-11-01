import { getProfile } from "@/services/playerProfile";
import { getApplicationStatus } from "@/services/venueApplication";
import toast from "react-hot-toast";

// Role + uski state dekh kar batata hai user ka "home" page kaunsa hai.
// Signin aur access dono isi ko call karte hain.
export async function getHomeRoute(
  role: string,
  fromAccess: boolean = false
): Promise<string> {
  try {
    if (role === "PLAYER") {
      if (!fromAccess) {
        return "/dashboard";
      }

      const { profile } = await getProfile();

      return !profile || !profile.isProfileComplete
        ? "/userProfile"
        : "/dashboard";
    }

    if (role === "OWNER") {
      const { status } = await getApplicationStatus();
      if (status === null) return "/venueApplication";   // abhi form nahi bhara
      if (status === "APPROVED") return "/venueDashboard"; // verified owner
      return "/applicationStatus";                         // PENDING ya REJECTED
    }

    if (role === "ADMIN") return "/admin";

    toast.error("User role not recognized");
  } catch {
    // backend call fail ho jaye to landing pe bhej do
  }

  return "/";
}