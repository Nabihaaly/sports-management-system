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

      const route = await getHomeRoute(data.role,true);
      router.push(route);
    } catch (error) {
      toast.error("Could not save role");
    }

  }

  const optionClass = (value: string) =>
    `relative flex min-h-[280px] flex-col justify-between gap-6 transition sm:min-h-[340px] ${
      value === "PLAYER" ? "card-lime" : "card-dark"
    } ${
      role === value
        ? "ring-4 ring-ink ring-offset-4 ring-offset-cream"
        : "hover:-translate-y-0.5"
    }`;

  return (
    <div className="page flex flex-col items-center pt-16">
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-2 text-center">
          <p className="eyebrow">One last step</p>
          <h1 className="page-title">How do you play?</h1>
          <p className="text-sm text-muted">
            You can book courts as a player or list your venue as an owner.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Player */}
          <div className={optionClass("PLAYER")}>
            {role === "PLAYER" && (
              <span className="absolute right-5 top-5 inline-flex items-center rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white">
                Selected
              </span>
            )}
            <div className="space-y-3">
              <p className="eyebrow text-ink/70">Player</p>
              <h2 className="font-heading text-4xl font-black uppercase tracking-tight leading-[0.95] sm:text-5xl">
                Book
                <br />
                &amp; play
              </h2>
              <p className="text-sm text-ink/80">Find and book courts near you.</p>
            </div>
            <button
              type="button"
              onClick={() => setrole("PLAYER")}
              aria-pressed={role === "PLAYER"}
              className="btn-primary w-full"
            >
              {role === "PLAYER" ? "Player selected" : "I'm a player"}
            </button>
          </div>

          {/* Venue Owner */}
          <div className={optionClass("OWNER")}>
            {role === "OWNER" && (
              <span className="absolute right-5 top-5 inline-flex items-center rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-ink">
                Selected
              </span>
            )}
            <div className="space-y-3">
              <p className="eyebrow text-white/70">Venue Owner</p>
              <h2 className="font-heading text-4xl font-black uppercase tracking-tight leading-[0.95] sm:text-5xl">
                List
                <br />
                your venue
              </h2>
              <p className="text-sm text-white/80">List your venue and manage bookings.</p>
            </div>
            <button
              type="button"
              onClick={() => setrole("OWNER")}
              aria-pressed={role === "OWNER"}
              className="btn-accent w-full"
            >
              {role === "OWNER" ? "Owner selected" : "I own a venue"}
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <button type="button" onClick={handleRole} className="btn-primary w-full sm:w-auto sm:min-w-[240px]">
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default page
