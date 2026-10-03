"use client"
import { getPlayerData } from "@/services/playerDashboard";
import { useEffect, useState } from "react";

const page = () => {
    const [playerdata,setplayerdata] = useState<string>("")

    const handlePlayerData = async ()=>{
        try {
      const data = await getPlayerData();
      setplayerdata(data.message);

    } catch (error) {
      throw error;
    }
    }

    useEffect(()=>{
        handlePlayerData();
    })
  return (
    <div>{playerdata}</div>
  )
}

export default page