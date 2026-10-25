"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";
import { getHomeRoute } from "@/lib/redirectAfterAuth";

type Props = {
  role: "PLAYER" | "OWNER" | "ADMIN";
  children: React.ReactNode;
};

// Page ko lapet do: sirf diye gaye role ka user dekh sakta hai.
// Galat user ko uske apne home page pe bhej deta hai.

const RequireRole = ({ role, children }: Props) => {
  const { session, isLoading, isLoggedIn } = useSports();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const userRole = session?.user?.role ?? "";
  const allowed = isLoggedIn && userRole === role;

  useEffect(() => {
    if (isLoading) return;           // session abhi load ho raha hai

    if (!isLoggedIn) {
      router.replace("/");           // login nahi → landing
      return;
    }
    if (!allowed) {
      getHomeRoute(userRole).then((r) => router.replace(r)); // galat role → apna home
      return;
    }
    setChecked(true);
  }, [isLoading, isLoggedIn, allowed, userRole, router]);

  if (isLoading || !checked) return <p>Loading...</p>;
  return <>{children}</>;
};

export default RequireRole;