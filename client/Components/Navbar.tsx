"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSports } from "@/Context/SportsContext";
import { getApplicationStatus, OwnerStatus } from "@/services/venueApplication";
import Signout from "./Signout";

// Mockups: public → Platforms / Bookings / Live Streamings
//          Player → Play / Tournaments / Go Live / My Bookings
//          Owner  → Dashboards / Venues / Bookings / Tournaments
const LINKS = {
  guest: [
    { label: "Platforms", href: "/#platforms" },
    { label: "Bookings", href: "/#bookings" },
    { label: "Live Streamings", href: "/#live" },
  ],
  PLAYER: [
    { label: "Play", href: "/dashboard" },
    { label: "Tournaments", href: "/dashboard#tournaments" },
    { label: "Go Live", href: "/dashboard#live" },
    { label: "My Profile", href: "/Profile" },
  ],
  OWNER: [
    { label: "Dashboard", href: "/venueDashboard" },
    { label: "Bookings", href: "/ownerBookings" },
    { label: "Add venue", href: "/venueApplication" },
  ],
  ADMIN: [{ label: "Applications", href: "/admin" }],
};

const Navbar = () => {
  const { setshowsignin, setshowsignup, session, isLoggedIn } =
    useSports();
  const router = useRouter();
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus | null>(null);

  const role = session?.user.role as "PLAYER" | "OWNER" | "ADMIN" | undefined;
  const isOwner = isLoggedIn && role === "OWNER";

  useEffect(() => {
    if (!isOwner) {
      setOwnerStatus(null);
      return;
    }
    let cancelled = false;
    getApplicationStatus()
      .then(({ status }) => {
        if (!cancelled) setOwnerStatus(status);
      })
      .catch(() => {
        if (!cancelled) setOwnerStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, session?.user.id]);

  // Owner jab tak approved nahi, uska "home" application/status page hai (venueDashboard nahi)
  const ownerHome =
    ownerStatus === "APPROVED"
      ? "/venueDashboard"
      : ownerStatus === null
        ? "/venueApplication"
        : "/applicationStatus";

  const homeHref = !isLoggedIn || !role
    ? "/"
    : role === "OWNER"
      ? ownerHome
      : role === "ADMIN"
        ? "/admin"
        : "/dashboard";

  const links =
    !isLoggedIn || !role
      ? LINKS.guest
      : isOwner && ownerStatus !== "APPROVED"
        ? [{ label: ownerStatus === null ? "Application" : "Application Status", href: ownerHome }]
        : LINKS[role];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        {/* Logo → user ke role ka home */}
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 font-heading text-xl font-black uppercase tracking-tight text-ink"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-lime" aria-hidden="true" />
          Court Connect
        </Link>

        {/* Center links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              {isOwner && ownerStatus === null && (
                <button onClick={() => router.push("/venueApplication")} className="btn-outline">
                  Fill application
                </button>
              )}
              {isOwner && (ownerStatus === "PENDING" || ownerStatus === "REJECTED") && (
                <button onClick={() => router.push("/applicationStatus")} className="btn-outline">
                  Check status
                </button>
              )}
              <span className="chip-active hidden sm:inline-flex">
                {role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : "Player"}
              </span>
              <Signout />
            </>
          ) : (
            <>
              <button onClick={() => setshowsignin(true)} className="btn-ghost">
                Login
              </button>
              <button onClick={() => setshowsignup(true)} className="btn-primary">
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

    </header>
  );
};

export default Navbar;
