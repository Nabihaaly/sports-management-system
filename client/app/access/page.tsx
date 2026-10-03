"use client"
import { useState } from "react"
import { updateRole } from "@/services/setRole"
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


const page = () => {
    const [role,setrole] = useState("")
    const router = useRouter();

    const handleRole = async () => {
        if(!role){
            toast.error("Please select a role")
        }
        try{
            const data = await updateRole(role);
            setrole("");
            
        if (data.role === "PLAYER") {
          router.push("/dashboard");
        } else if (data.role === "OWNER") {
          router.push("/ownerDetails");
        } else {
          toast.error("User role not recognized");
        }
        }
        catch(error){
            throw error; 
        }
        
    }
  return (
    <div>
        <p>Do you want to continue as?</p>
        <button onClick={()=>setrole("PLAYER")}>Player</button>
        <button onClick={()=>setrole("OWNER")}>Venue Owner</button>
        <button onClick={handleRole}>Save</button>
    </div>
  )
}

export default page