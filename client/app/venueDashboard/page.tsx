"use client"

import { useCallback, useEffect, useState } from "react";
import AddCourts from "@/Components/AddCourt";
import { getMyVenues, OwnerVenue } from "@/services/courts";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const Page = () => {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
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

  return (
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
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedVenue}
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
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{selectedVenue.venueName}</h2>
            <p>
              {selectedVenue.address}, {selectedVenue.city}
            </p>
            {selectedVenue.description && <p>{selectedVenue.description}</p>}
            <p className="text-sm">
              Size: {selectedVenue.sizeOfVenue} · Price range:{" "}
              {selectedVenue.courtsPriceRange}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Courts</h3>

            {selectedVenue.courts.length === 0 ? (
              <p className="text-sm">No courts added to this venue yet.</p>
            ) : (
              selectedVenue.courts.map((court) => (
                <div key={court.id} className="border rounded-md p-3 space-y-1">
                  <p className="font-medium">
                    {court.courtName} · {court.sport} · {court.courtType} · up to{" "}
                    {court.maxPlayers} players · Rs. {court.pricePerSlotPKR}/slot
                  </p>
                  <p className="text-sm">
                    {court.openingTime}-{court.closingTime} ·{" "}
                    {court.bookingDurationMinutes} min slots ·{" "}
                    {court.operatingDays.map((d) => DAY_LABELS[d] ?? d).join(", ")}
                    {!court.isActive && " · Inactive"}
                  </p>
                  {court.description && <p className="text-sm">{court.description}</p>}
                  {court.availabilities.length > 0 && (
                    <p className="text-sm">
                      Availability:{" "}
                      {court.availabilities
                        .map(
                          (a) =>
                            `${DAY_LABELS[a.dayOfWeek] ?? a.dayOfWeek} ${a.startTime}-${a.endTime}`,
                        )
                        .join(", ")}
                    </p>
                  )}
                </div>
              ))
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
  );
};

export default Page