
"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import toast from "react-hot-toast";

const Signin = () => {
const handleLogout = async () => {
  try {
    await authClient.signOut();

    toast.success("Logged out successfully!");
  } catch (error) {
    toast.error("Logout failed");
  }
};

  return (
    <div>
<button onClick={handleLogout}>
  Logout
</button>
    </div>
    
  );
};

export default Signin;
