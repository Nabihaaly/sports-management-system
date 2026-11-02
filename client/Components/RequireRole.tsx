"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  if (isLoading || !checked) {
    // Session loaded but this user isn't allowed here — redirect is in flight.
    if (!isLoading && !allowed) {
      return (
        <div className="page-narrow flex min-h-[60vh] items-center justify-center">
          <div className="card w-full max-w-md space-y-5 p-8 text-center">
            <p className="eyebrow">Access</p>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight leading-[0.95] text-ink">
              Members only
            </h2>
            <p className="text-sm text-muted">
              You don&apos;t have access to this page. Taking you back to where you belong.
            </p>
            <Link href="/" className="btn-primary w-full">
              Back to home
            </Link>
          </div>
        </div>
      );
    }

    // Loading skeleton
    return (
      <div className="page space-y-6" aria-busy="true" aria-live="polite">
        <div className="space-y-3">
          <div className="h-3 w-20 animate-pulse rounded-pill bg-mist" />
          <div className="h-12 w-2/3 max-w-sm animate-pulse rounded-2xl bg-mist" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-56 animate-pulse rounded-3xl bg-mist" />
          <div className="h-56 animate-pulse rounded-3xl bg-mist" />
          <div className="hidden h-56 animate-pulse rounded-3xl bg-mist lg:block" />
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
  return <>{children}</>;
};

export default RequireRole;
