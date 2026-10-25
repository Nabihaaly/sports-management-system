"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RequireRole from "@/Components/RequireRole";
import {
  listApplications,
  reviewApplication,
  OwnerStatus,
  VenueApplication,
} from "@/services/admin";

const TABS: OwnerStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const Page = () => {
  const [tab, setTab] = useState<OwnerStatus>("PENDING");
  const [apps, setApps] = useState<VenueApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (status: OwnerStatus) => {
    setLoading(true);
    try {
      const { applications } = await listApplications(status);
      setApps(applications);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (status === "REJECTED") {
      const ok = window.confirm(
        tab === "APPROVED"
          ? "Revoke approval? The owner will lose dashboard access."
          : "Reject this application?",
      );
      if (!ok) return;
    }
    setBusyId(id);
    try {
      await reviewApplication(id, status);
      toast.success(status === "APPROVED" ? "Application approved" : "Application rejected");
      await load(tab);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <RequireRole role="ADMIN">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Venue Applications</h1>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border rounded-md px-3 py-1 ${tab === t ? "bg-black text-white" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : apps.length === 0 ? (
          <p className="text-gray-600">No {tab.toLowerCase()} applications.</p>
        ) : (
          <div className="space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{a.venueName} — {a.city}</p>
                    <p className="text-sm text-gray-600">{a.address}</p>
                    <p className="text-sm text-gray-600">
                      {a.sizeOfVenue} · {a.courtsPriceRange}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-sm bg-gray-50 rounded-md p-3">
                  <p className="font-medium">Owner: {a.venueOwner.fullName}</p>
                  <p>
                    {a.venueOwner.user.email} · {a.venueOwner.phoneNumber} · CNIC{" "}
                    {a.venueOwner.cnic}
                  </p>
                  <p>Business reg: {a.businessRegistration || "—"}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  {a.status !== "APPROVED" && (
                    <button
                      disabled={busyId === a.id}
                      onClick={() => handleReview(a.id, "APPROVED")}
                      className="bg-green-600 text-white rounded-md px-4 py-2 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {a.status !== "REJECTED" && (
                    <button
                      disabled={busyId === a.id}
                      onClick={() => handleReview(a.id, "REJECTED")}
                      className="border border-red-600 text-red-600 rounded-md px-4 py-2 disabled:opacity-50"
                    >
                      {a.status === "APPROVED" ? "Revoke approval" : "Reject"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
};

export default Page;