"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CourtDetail, getCourt, WeekDay } from "@/services/courts";

const DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: "MONDAY", label: "Monday", short: "Mon" },
  { value: "TUESDAY", label: "Tuesday", short: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { value: "THURSDAY", label: "Thursday", short: "Thu" },
  { value: "FRIDAY", label: "Friday", short: "Fri" },
  { value: "SATURDAY", label: "Saturday", short: "Sat" },
  { value: "SUNDAY", label: "Sunday", short: "Sun" },
];

const SHORT_LABELS: Record<string, string> = Object.fromEntries(
  DAYS.map((d) => [d.value, d.short]),
);

// "13:00" -> "1:00 PM"
const format12h = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const Page = () => {
  const router = useRouter();
  const { courtId } = useParams<{ courtId: string }>();

  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState<WeekDay | "">("");

  useEffect(() => {
    if (!courtId) return;
    getCourt(courtId)
      .then(setCourt)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load court"),
      )
      .finally(() => setLoading(false));
  }, [courtId]);

  // Availability: only active slots, only days that have slots
  const activeSlots = (court?.availabilities ?? []).filter(
    (a) => a.isActive !== false,
  );
  const daysWithSlots = DAYS.filter((d) =>
    activeSlots.some((a) => a.dayOfWeek === d.value),
  );
  const currentDay = daysWithSlots.some((d) => d.value === selectedDay)
    ? selectedDay
    : daysWithSlots[0]?.value;
  const daySlots = activeSlots
    .filter((a) => a.dayOfWeek === currentDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <button onClick={() => router.back()} className="underline text-sm">
        &larr; Back to courts
      </button>

      {loading && <p>Loading court...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {court && (
        <>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{court.courtName}</h1>
              <span className="text-xs border rounded-full px-2 py-0.5">
                {court.courtType === "INDOOR" ? "Indoor" : "Outdoor"}
              </span>
              {!court.isActive && (
                <span className="text-xs border border-red-600 text-red-600 rounded-full px-2 py-0.5">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm">
              {court.venue.venueName} · {court.venue.city}
            </p>
            {court.description && <p className="pt-2">{court.description}</p>}
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="font-semibold">Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Detail label="Sport" value={court.sport} />
              <Detail label="Max players" value={court.maxPlayers} />
              <Detail label="Price per slot" value={`Rs. ${court.pricePerSlotPKR}`} />
              <Detail
                label="Default slot length"
                value={`${court.bookingDurationMinutes} min`}
              />
              <Detail
                label="Opening hours"
                value={`${format12h(court.openingTime)} – ${format12h(court.closingTime)}`}
              />
              <Detail
                label="Operating days"
                value={court.operatingDays
                  .map((d) => SHORT_LABELS[d] ?? d)
                  .join(", ")}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Availability</h2>

            {daysWithSlots.length === 0 ? (
              <p className="text-sm">No slots set up yet.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <label htmlFor="availability-day" className="text-sm">
                    Day
                  </label>
                  <select
                    id="availability-day"
                    value={currentDay}
                    onChange={(e) => setSelectedDay(e.target.value as WeekDay)}
                    className="border rounded-md p-2"
                  >
                    {daysWithSlots.map((d) => {
                      const count = activeSlots.filter(
                        (a) => a.dayOfWeek === d.value,
                      ).length;
                      return (
                        <option key={d.value} value={d.value}>
                          {d.label} ({count} {count === 1 ? "slot" : "slots"})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {daySlots.map((s, i) => (
                    <li
                      key={s.id ?? i}
                      className="border rounded-md px-3 py-2 text-sm text-center"
                    >
                      {format12h(s.startTime)} – {format12h(s.endTime)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Page;