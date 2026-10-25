"use client"
import { useState } from "react"
import { updateRole } from '../../services/setRole';
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getHomeRoute } from "@/lib/redirectAfterAuth";


const page = () => {
  const [role, setrole] = useState("")
  const router = useRouter();

  const handleRole = async () => {
    if (!role) {
      toast.error("Please select a role")
      return; 
    }

    try {
      const data = await updateRole(role);
      setrole("");

      const route = await getHomeRoute(data.role);
      router.push(route);
    } catch (error) {
      toast.error("Could not save role");
    }

  }
  return (
    <div>
      <p>Do you want to continue as?</p>
      <button onClick={() => setrole("PLAYER")}>Player</button>
      <button onClick={() => setrole("OWNER")}>Venue Owner</button>
      <button onClick={handleRole}>Save</button>
    </div>
  )
}

export default page