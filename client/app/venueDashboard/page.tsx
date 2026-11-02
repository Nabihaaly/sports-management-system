"use client"

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddCourts from "@/Components/AddCourt";
import { getMyVenues, OwnerVenue, setVenueActive } from "@/services/courts";
import RequireRole from "@/Components/RequireRole";

import ImagePicker from "@/Components/ImagePicker";
import { setVenueImages, uploadVenueImages } from "@/services/venueApplication";

const Page = () => {

  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  const loadVenues = useCallback(async () => {
    try {
      const data = await getMyVenues();
      setVenues(data);
      // Keep the current selection if it still exists, otherwise pick the first venue
      setSelectedId((current) =>
        data.some((v) => v.id === current) ? current : data[0]?.id ?? "",
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const selectedVenue = venues.find((v) => v.id === selectedId);

  const toggleVenueActive = async () => {
    if (!selectedVenue) return;
    const next = !selectedVenue.isActive;
    const message = next
      ? `Activate "${selectedVenue.venueName}" and all its courts?`
      : `Deactivate "${selectedVenue.venueName}" and all its courts?`;
    if (!window.confirm(message)) return;

    setToggling(true);
    try {
      await setVenueActive(selectedVenue.id, next);
      await loadVenues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setToggling(false);
    }
  };

  return (
    <RequireRole role="OWNER">

    <div className="page space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Owner</p>
          <h1 className="page-title">
            {selectedVenue ? selectedVenue.venueName : "Venue Dashboard"}
          </h1>
          {selectedVenue && (
            <p className="text-sm text-muted">
              Manage your courts, photos and availability.
            </p>
          )}
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href="/ownerBookings" className="btn-outline flex-1 sm:flex-none">
            View bookings
          </Link>
          <Link href="/venueApplication" className="btn-ghost flex-1 sm:flex-none">
            + Add venue
          </Link>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={!selectedVenue || !selectedVenue.isActive}
            className="btn-accent flex-1 sm:flex-none"
          >
            + Add court
          </button>
        </div>
      </div>

      {/* Venue selector */}
      {venues.length > 1 && (
        <div className="space-y-2">
          <p className="eyebrow">Your venues</p>
          <div className="flex flex-wrap gap-2">
            {venues.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => setSelectedId(venue.id)}
                aria-pressed={venue.id === selectedId}
                className={venue.id === selectedId ? "chip-active" : "chip"}
              >
                {venue.venueName}
                <span className="ml-1.5 text-muted">· {venue.city}</span>
                {!venue.isActive && (
                  <span className="ml-1.5 text-danger">· Inactive</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <div className="h-56 animate-pulse rounded-3xl bg-mist" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-3xl bg-mist" />
            <div className="h-64 animate-pulse rounded-3xl bg-mist" />
            <div className="h-64 animate-pulse rounded-3xl bg-mist" />
          </div>
        </div>
      )}
      {error && (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {!loading && !error && venues.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-heading text-2xl font-black uppercase tracking-tight text-ink">
            No approved venues yet
          </p>
          <p className="mt-2 text-sm text-muted">
            Once your application is approved, your venue will show up here.
          </p>
        </div>
      )}

      {selectedVenue && (
        <div className="space-y-10">
          {/* Selected venue panel */}
          <section className="card overflow-hidden p-0">
            {/* Cover strip */}
            <div className="relative h-48 w-full overflow-hidden bg-forest sm:h-64">
              {selectedVenue.images?.[0] ? (
                <img
                  src={selectedVenue.images[0]}
                  alt={selectedVenue.venueName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-lime">
                    No photos yet
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="chip bg-white/90 text-ink">{selectedVenue.city}</span>
                {!selectedVenue.isActive && (
                  <span className="badge-danger">Inactive</span>
                )}
              </div>
              <h2 className="absolute bottom-4 left-4 right-4 font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
                {selectedVenue.venueName}
              </h2>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    {selectedVenue.address}, {selectedVenue.city}
                  </p>
                  {selectedVenue.description && (
                    <p className="max-w-2xl text-sm text-ink">{selectedVenue.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="chip">Size: {selectedVenue.sizeOfVenue}</span>
                    <span className="chip">
                      Price range: {selectedVenue.courtsPriceRange}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleVenueActive}
                  disabled={toggling}
                  className={selectedVenue.isActive ? "btn-danger" : "btn-outline"}
                >
                  {toggling
                    ? "Updating..."
                    : selectedVenue.isActive
                      ? "Deactivate venue"
                      : "Activate venue"}
                </button>
              </div>

              <div className="space-y-3 border-t border-line pt-5">
                <div>
                  <h3 className="eyebrow">Photos</h3>
                  <p className="mt-1 text-xs text-muted">
                    First photo is the cover players see.
                  </p>
                </div>
                <ImagePicker
                  images={selectedVenue.images ?? []}
                  onChange={async (images) => {
                    await setVenueImages(selectedVenue.id, images);
                    await loadVenues();
                  }}
                  upload={uploadVenueImages}
                />
              </div>
            </div>
          </section>

          {/* Courts */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Courts</p>
                <h3 className="section-title">
                  {selectedVenue.courts.length}{" "}
                  {selectedVenue.courts.length === 1 ? "court" : "courts"}
                </h3>
              </div>
            </div>

            {selectedVenue.courts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line p-10 text-center">
                <p className="font-heading text-2xl font-black uppercase tracking-tight text-ink">
                  No courts yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Add your first court to start taking bookings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedVenue.courts.map((court) => (
                  <Link
                    key={court.id}
                    href={`ViewCourts/${court.id}`}
                    className={`group card flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-ink ${
                      !court.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      {court.images?.[0] ? (
                        <img
                          src={court.images[0]}
                          alt={court.courtName}
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-forest">
                          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-lime">
                            No photos yet
                          </p>
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex gap-2">
                        <span className="chip bg-white/90 text-ink">
                          {court.courtType === "INDOOR" ? "Indoor" : "Outdoor"}
                        </span>
                        {!court.isActive && (
                          <span className="badge-danger">Inactive</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <h4 className="font-heading text-xl font-black uppercase leading-[0.95] tracking-tight text-ink">
                        {court.courtName}
                      </h4>
                      <p className="line-clamp-2 text-sm text-muted">
                        {court.description || "No description"}
                      </p>
                      <p className="mt-auto pt-2 text-xs font-semibold text-muted transition group-hover:text-ink">
                        View court &rarr;
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showModal && selectedVenue && (
        <AddCourts
          venueId={selectedVenue.id}
          venueName={selectedVenue.venueName}
          onClose={() => setShowModal(false)}
          onCreated={loadVenues}
        />
      )}
    </div>

  </RequireRole>
  );
};

export default Page
