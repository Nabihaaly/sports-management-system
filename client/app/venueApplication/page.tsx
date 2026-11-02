'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApplication,uploadVenueImages } from '../../services/venueApplication';
import RequireRole from '@/Components/RequireRole';

import ImagePicker from "@/Components/ImagePicker";

const Page = () => {
  const router = useRouter();
  const [venueOwner, setVenueOwner] = useState({
    fullName: "",
    cnic: "",
    phoneNumber: "",
  });
  const [venueDetails, setVenueDetails] = useState({
    venueName: "",
    description: "",
    address: "",
    city: "",
    images: [] as string[],
    businessRegistration: "",
    sizeOfVenue: "",
    courtsPriceRange: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVenueOwner({ ...venueOwner, [e.target.name]: e.target.value });
  };

  const handleVenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVenueDetails({ ...venueDetails, [e.target.name]: e.target.value });
  };



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await createApplication(venueOwner, venueDetails);
      setSuccess(true);
      router.push('/applicationStatus');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireRole role="OWNER">


    <div className="page">
      <div className="mb-10 max-w-2xl space-y-3">
        <p className="eyebrow">Venue application</p>
        <h1 className="page-title">List your venue.</h1>
        <p className="text-muted">
          A quick form — we&apos;ll verify your details and get you live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Personal */}
          <section className="card space-y-5">
            <div>
              <p className="eyebrow">01 — Personal</p>
              <h2 className="section-title">Owner details</h2>
              <p className="mt-1 text-sm text-muted">Who we&apos;ll be in touch with.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="fullName" className="label">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  value={venueOwner.fullName}
                  onChange={handleOwnerChange}
                  placeholder="Enter your full name"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="cnic" className="label">CNIC</label>
                <input
                  id="cnic"
                  type="text"
                  name="cnic"
                  required
                  value={venueOwner.cnic}
                  onChange={handleOwnerChange}
                  placeholder="12345-1234567-1"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="label">Phone number</label>
                <input
                  id="phoneNumber"
                  type="text"
                  name="phoneNumber"
                  required
                  value={venueOwner.phoneNumber}
                  onChange={handleOwnerChange}
                  placeholder="Enter your phone number"
                  className="input"
                />
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="card space-y-5">
            <div>
              <p className="eyebrow">02 — Photos</p>
              <h2 className="section-title">Venue photos</h2>
              <p className="mt-1 text-sm text-muted">
                Show players the space. First photo becomes the cover.
              </p>
            </div>
            <ImagePicker
              images={venueDetails.images}
              onChange={(images) => setVenueDetails({ ...venueDetails, images })}
              upload={uploadVenueImages}
            />
          </section>

          {/* Venue */}
          <section className="card space-y-5 md:col-span-2">
            <div>
              <p className="eyebrow">03 — Venue</p>
              <h2 className="section-title">Venue details</h2>
              <p className="mt-1 text-sm text-muted">What players will see when they book.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="venueName" className="label">Venue name</label>
                <input
                  id="venueName"
                  type="text"
                  name="venueName"
                  required
                  value={venueDetails.venueName}
                  onChange={handleVenueChange}
                  placeholder="Enter venue name"
                  className="input"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="label">Description</label>
                <input
                  id="description"
                  name="description"
                  value={venueDetails.description}
                  onChange={handleVenueChange}
                  placeholder="Describe your venue"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="address" className="label">Address</label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  required
                  value={venueDetails.address}
                  onChange={handleVenueChange}
                  placeholder="Enter venue address"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="city" className="label">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  required
                  value={venueDetails.city}
                  onChange={handleVenueChange}
                  placeholder="Enter city"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="sizeOfVenue" className="label">Size of venue</label>
                <input
                  id="sizeOfVenue"
                  type="text"
                  name="sizeOfVenue"
                  required
                  value={venueDetails.sizeOfVenue}
                  onChange={handleVenueChange}
                  placeholder="e.g. 10,000 sq ft"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="courtsPriceRange" className="label">Courts price range</label>
                <input
                  id="courtsPriceRange"
                  type="text"
                  name="courtsPriceRange"
                  required
                  value={venueDetails.courtsPriceRange}
                  onChange={handleVenueChange}
                  placeholder="e.g. Rs. 1,500 - Rs. 3,000 per hour"
                  className="input"
                />
              </div>
            </div>
          </section>
        </div>

        {error && (
          <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
            Application submitted successfully.
          </p>
        )}

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            We review most applications within a couple of days.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      </form>
    </div>

    </RequireRole>
  )
}

export default Page
