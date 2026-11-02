"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AddCourts from "@/Components/AddCourt";
import {
  CourtDetail,
  getCourt,
  setCourtImages,
  uploadCourtImages,
  WeekDay,
} from "@/services/courts";
import ImagePicker from "@/Components/ImagePicker";
import Court3DViewer from "@/Components/Court3DViewer";
import CourtModelUpload from "@/Components/CourtModelUpload";

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
  <div className="rounded-2xl bg-mist/60 p-4">
    <p className="eyebrow">{label}</p>
    <p className="mt-1 font-heading text-lg font-bold text-ink">{value}</p>
  </div>
);

const Page = () => {
  const router = useRouter();
  const { courtId } = useParams<{ courtId: string }>();

  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState<WeekDay | "">("");

  const [showEdit, setShowEdit] = useState(false);

  const loadCourt = useCallback(async () => {
    if (!courtId) return;
    try {
      setCourt(await getCourt(courtId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load court");
    } finally {
      setLoading(false);
    }
  }, [courtId]);

  useEffect(() => {
    loadCourt();
  }, [loadCourt]);

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
    <div className="page-narrow space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => router.back()} className="btn-ghost -ml-4">
          &larr; Back to courts
        </button>
        {court && (
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="btn-primary"
          >
            Edit court
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <div className="h-10 w-2/3 animate-pulse rounded-3xl bg-mist" />
          <div className="h-40 animate-pulse rounded-3xl bg-mist" />
          <div className="h-40 animate-pulse rounded-3xl bg-mist" />
        </div>
      )}
      {error && (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {court && (
        <>
          {/* Header */}
          <div className="space-y-3">
            <p className="eyebrow">
              {court.venue.venueName} · {court.venue.city}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title">{court.courtName}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="chip">
                  {court.courtType === "INDOOR" ? "Indoor" : "Outdoor"}
                </span>
                <span className="chip">{court.sport}</span>
                {!court.isActive && (
                  <span className="badge-danger">Inactive</span>
                )}
              </div>
            </div>
            {court.description && (
              <p className="max-w-2xl text-muted">{court.description}</p>
            )}
          </div>

          {/* Photos */}
          <section className="card space-y-4">
            <div>
              <p className="eyebrow">Photos</p>
              <h2 className="section-title">Gallery</h2>
              <p className="mt-1 text-xs text-muted">
                Players see these on the court page. First photo is the cover.
              </p>
            </div>
            <ImagePicker
              images={court.images ?? []}
              onChange={async (images) => {
                await setCourtImages(court.id, images);
                await loadCourt();
              }}
              upload={(files) => uploadCourtImages(court.id, files)}
            />
          </section>

          {/* 3D view */}
          <section className="card space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">3D view</p>
                <h2 className="section-title">Walkthrough</h2>
                {!court.model3dUrl && (
                  <p className="mt-1 text-xs text-muted">
                    Optional — let players walk through your court before booking.
                  </p>
                )}
              </div>
              <CourtModelUpload
                courtId={court.id}
                hasModel={!!court.model3dUrl}
                onChanged={loadCourt}
              />
            </div>

            {court.model3dUrl && (
              <Court3DViewer
                src={court.model3dUrl}
                alt={`3D view of ${court.courtName}`}
              />
            )}
          </section>

          {/* Details */}
          <section className="card space-y-4">
            <div>
              <p className="eyebrow">Details</p>
              <h2 className="section-title">At a glance</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
          </section>

          {/* Availability */}
          <section className="card space-y-4">
            <div>
              <p className="eyebrow">Availability</p>
              <h2 className="section-title">Bookable slots</h2>
            </div>

            {daysWithSlots.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line p-10 text-center">
                <p className="font-heading text-xl font-black uppercase tracking-tight text-ink">
                  No slots yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Edit the court to set up its weekly schedule.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="availability-day" className="label mb-0">
                    Day
                  </label>
                  <select
                    id="availability-day"
                    value={currentDay}
                    onChange={(e) => setSelectedDay(e.target.value as WeekDay)}
                    className="input w-auto min-w-[12rem]"
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

                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {daySlots.map((s, i) => (
                    <li
                      key={s.id ?? i}
                      className="rounded-2xl bg-mist px-3 py-2.5 text-center text-sm font-medium text-ink"
                    >
                      {format12h(s.startTime)} – {format12h(s.endTime)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      {showEdit && court && (
        <AddCourts
          venueId={court.venue.id}
          venueName={court.venue.venueName}
          court={court}
          onClose={() => setShowEdit(false)}
          onCreated={loadCourt}
        />
      )}
    </div>
  );
};

export default Page;
