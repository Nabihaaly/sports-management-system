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
      <div className="page space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Admin</p>
            <h1 className="page-title">Applications</h1>
            <p className="text-sm text-muted">
              Review new venues, approve the ones that are ready, and manage existing owners.
            </p>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Application status">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`${tab === t ? "chip-active" : "chip"} px-4 py-1.5 capitalize`}
              >
                {t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            <div className="h-48 animate-pulse rounded-3xl bg-mist" />
            <div className="h-48 animate-pulse rounded-3xl bg-mist" />
            <div className="h-48 animate-pulse rounded-3xl bg-mist" />
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center">
            <p className="font-heading text-2xl font-black uppercase tracking-tight leading-[0.95] text-ink">
              No {tab.toLowerCase()} applications
            </p>
            <p className="mt-2 text-sm text-muted">
              New venue applications will show up here as they come in.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((a) => (
              <article key={a.id} className="card space-y-6 sm:p-6">
                {/* Top row: venue + status + date */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-heading text-2xl font-black uppercase tracking-tight leading-[0.95] text-ink sm:text-3xl">
                        {a.venueName}
                      </h2>
                      <span
                        className={
                          a.status === "APPROVED"
                            ? "badge-success"
                            : a.status === "REJECTED"
                              ? "badge-danger"
                              : "badge-warning"
                        }
                      >
                        {a.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {a.address}, {a.city}
                    </p>
                    {a.description && (
                      <p className="max-w-2xl text-sm text-ink/80">{a.description}</p>
                    )}
                  </div>
                  <p className="eyebrow whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Venue details */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-2xl bg-mist/60 p-4 sm:grid-cols-3">
                  <div>
                    <p className="label">City</p>
                    <p className="text-sm font-semibold text-ink">{a.city}</p>
                  </div>
                  <div>
                    <p className="label">Venue size</p>
                    <p className="text-sm font-semibold text-ink">{a.sizeOfVenue}</p>
                  </div>
                  <div>
                    <p className="label">Court price range</p>
                    <p className="text-sm font-semibold text-ink">{a.courtsPriceRange}</p>
                  </div>
                </div>

                {/* Owner details */}
                <div className="space-y-3">
                  <p className="eyebrow">Owner</p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="min-w-0">
                      <p className="label">Full name</p>
                      <p className="truncate text-sm font-semibold text-ink">
                        {a.venueOwner.fullName}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="label">Email</p>
                      <p className="truncate text-sm text-ink">{a.venueOwner.user.email}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="label">Phone</p>
                      <p className="text-sm text-ink">{a.venueOwner.phoneNumber}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="label">CNIC</p>
                      <p className="text-sm text-ink">{a.venueOwner.cnic}</p>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <p className="label">Business registration</p>
                      <p className="truncate text-sm text-ink">{a.businessRegistration || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:flex-wrap">
                  {a.status !== "APPROVED" && (
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => handleReview(a.id, "APPROVED")}
                      className="btn-accent w-full sm:w-auto"
                    >
                      Approve
                    </button>
                  )}
                  {a.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => handleReview(a.id, "REJECTED")}
                      className="btn-danger w-full sm:w-auto"
                    >
                      {a.status === "APPROVED" ? "Revoke approval" : "Reject"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
};

export default Page;
