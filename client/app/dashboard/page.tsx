"use client"
import RequireRole from '@/Components/RequireRole';
import { getPlayerData } from '../../services/playerDashboard';
import { useEffect, useState } from "react";

const page = () => {
  const [playerdata, setplayerdata] = useState<string>("")

  const handlePlayerData = async () => {
    try {
      const data = await getPlayerData();
      setplayerdata(data.message);

    } catch (error) {
      throw error;
    }
  }

  useEffect(() => { handlePlayerData(); }, [])
  return (
    <RequireRole role="PLAYER">

      <div>{playerdata}</div>
    </RequireRole>
  )
}

export default page