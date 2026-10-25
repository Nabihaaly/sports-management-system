'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApplication } from '../../services/venueApplication';
import RequireRole from '@/Components/RequireRole';

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
      
      
    <div>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Owner Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                value={venueOwner.fullName}
                onChange={handleOwnerChange}
                placeholder="Enter your full name"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">CNIC</label>
              <input
                type="text"
                name="cnic"
                required
                value={venueOwner.cnic}
                onChange={handleOwnerChange}
                placeholder="12345-1234567-1"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">Phone number</label>
              <input
                type="text"
                name="phoneNumber"
                required
                value={venueOwner.phoneNumber}
                onChange={handleOwnerChange}
                placeholder="Enter your phone number"
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>
        </div>

        {/* Venue Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Venue Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">Venue Name</label>
              <input
                type="text"
                name="venueName"
                required
                value={venueDetails.venueName}
                onChange={handleVenueChange}
                placeholder="Enter venue name"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">Description</label>
              <input
                name="description"
                value={venueDetails.description}
                onChange={handleVenueChange}
                placeholder="Describe your venue"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">Address</label>
              <input
                type="text"
                name="address"
                required
                value={venueDetails.address}
                onChange={handleVenueChange}
                placeholder="Enter venue address"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">City</label>
              <input
                type="text"
                name="city"
                required
                value={venueDetails.city}
                onChange={handleVenueChange}
                placeholder="Enter city"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">Size of Venue</label>
              <input
                type="text"
                name="sizeOfVenue"
                required
                value={venueDetails.sizeOfVenue}
                onChange={handleVenueChange}
                placeholder="e.g. 10,000 sq ft"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block mb-1">Courts Price Range</label>
              <input
                type="text"
                name="courtsPriceRange"
                required
                value={venueDetails.courtsPriceRange}
                onChange={handleVenueChange}
                placeholder="e.g. Rs. 1,500 - Rs. 3,000 per hour"
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {success && (
          <p className="text-green-600">Application submitted successfully.</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-md p-3 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Venue"}
        </button>
      </form>
    </div>
    
    </RequireRole>
  )
}

export default Page