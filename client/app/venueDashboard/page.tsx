"use client"

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddCourts from "@/Components/AddCourt";
import { getMyVenues, OwnerVenue, setVenueActive } from "@/services/courts";
import RequireRole from "@/Components/RequireRole";

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

    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold">Venue Dashboard</h1>

        <div className="flex items-center gap-3">
          {venues.length > 0 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="border rounded-md p-2"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.venueName} ({venue.city})
                  {!venue.isActive ? " - Inactive" : ""}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedVenue || !selectedVenue.isActive}
            className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
          >
            Add court
          </button>
        </div>
      </div>

      {loading && <p>Loading your venues...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && venues.length === 0 && (
        <p>You don&apos;t have any approved venues yet.</p>
      )}

      {selectedVenue && (
        <div className="border rounded-md p-4 space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{selectedVenue.venueName}</h2>
                {!selectedVenue.isActive && (
                  <span className="text-xs border border-red-600 text-red-600 rounded-full px-2 py-0.5">
                    Inactive
                  </span>
                )}
              </div>
              <p>
                {selectedVenue.address}, {selectedVenue.city}
              </p>
              {selectedVenue.description && <p>{selectedVenue.description}</p>}
              <p className="text-sm">
                Size: {selectedVenue.sizeOfVenue} · Price range:{" "}
                {selectedVenue.courtsPriceRange}
              </p>
            </div>

            <button
              onClick={toggleVenueActive}
              disabled={toggling}
              className={`border rounded-md px-4 py-2 disabled:opacity-50 ${
                selectedVenue.isActive
                  ? "border-red-600 text-red-600"
                  : "border-black"
              }`}
            >
              {toggling
                ? "Updating..."
                : selectedVenue.isActive
                  ? "Deactivate venue"
                  : "Activate venue"}
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Courts</h3>

            {selectedVenue.courts.length === 0 ? (
              <p className="text-sm">No courts added to this venue yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedVenue.courts.map((court) => (
                  <Link
                    key={court.id}
                    href={`ViewCourts/${court.id}`}
                    className={`block border rounded-lg p-4 space-y-2 hover:shadow-md hover:border-black transition ${
                      !court.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold">{court.courtName}</h4>
                      <span className="text-xs border rounded-full px-2 py-0.5 whitespace-nowrap">
                        {court.courtType === "INDOOR" ? "Indoor" : "Outdoor"}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {court.description || "No description"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
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