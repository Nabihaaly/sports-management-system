"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";
import { getHomeRoute } from "@/lib/redirectAfterAuth";

const ROLES = ["PLAYER", "OWNER", "ADMIN"];

// Landing page sirf guests ke liye hai. Logged-in user (owner/player/admin)
// "/" pe aaye to usko uske role ke home pe bhej do (wahi rules jo Signin use karta hai).
const HomeRedirect = () => {
  const { session, isLoggedIn, isLoading } = useSports();
  const router = useRouter();
  const role = session?.user.role as string | undefined;

  useEffect(() => {
    if (isLoading || !isLoggedIn || !role || !ROLES.includes(role)) return;
    let cancelled = false;
    getHomeRoute(role).then((route) => {
      if (!cancelled && route !== "/") router.replace(route);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isLoggedIn, role, router]);

  return null;
};

export default HomeRedirect;
