"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Signout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast.success("Logged out");
      router.push("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <button onClick={handleLogout} className="btn-ghost">
      Logout
    </button>
  );
};

export default Signout;
