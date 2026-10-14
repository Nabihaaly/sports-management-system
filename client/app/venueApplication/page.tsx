import { useState } from 'react'
import { createApplication } from '../../services/venueApplication';

const page = () => {
 const [venueOwner,setvenueOwner] = useState({
  fullName: "",
  cnic: "",
  phonenumber: "",
});
const [venueDetails,setvenueDetails] = useState({
  venueName: "",
  description: "",
  address: "",
  city: "",
  images: [],
  businessRegistration: "",
  sizeOfVenue: "",
  courtsPriceRange: "",
});


const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setvenueOwner({
    ...venueOwner,
    [e.target.name]: e.target.value,
  });
};

const handleVenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setvenueDetails({
    ...venueDetails,
    [e.target.name]: e.target.value,
  });
};

const handleSubmit = async () => {
  try{
    const data = await createApplication(venueOwner,venueDetails);
    console.log(data)
  }
  catch(error){
    throw error 
  }
}


  return (
    <div>
       <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Owner Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
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
              value={venueOwner.cnic}
              onChange={handleOwnerChange}
              placeholder="Enter your CNIC"
              className="w-full border rounded-md p-2"
            />
          </div>

                    <div>
            <label className="block mb-1">Phone number</label>
            <input
              type="text"
              name="cnic"
              value={venueOwner.phonenumber}
              onChange={handleOwnerChange}
              placeholder="Enter your phone number"
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>
      </div>

      {/* Venue Details */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Venue Details
        </h2>

        <div className="space-y-4">

          <div>
            <label className="block mb-1">Venue Name</label>
            <input
              type="text"
              name="venueName"
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
              value={venueDetails.city}
              onChange={handleVenueChange}
              placeholder="Enter city"
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* <div>
            <label className="block mb-1">
              Business Registration Document
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full border rounded-md p-2"
            />
          </div> */}

          <div>
            <label className="block mb-1">Size of Venue</label>
            <input
              type="text"
              name="sizeOfVenue"
              value={venueDetails.sizeOfVenue}
              onChange={handleVenueChange}
              placeholder="e.g. 10,000 sq ft"
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block mb-1">
              Courts Price Range
            </label>
            <input
              type="text"
              name="courtsPriceRange"
              value={venueDetails.courtsPriceRange}
              onChange={handleVenueChange}
              placeholder="e.g. Rs. 1,500 - Rs. 3,000 per hour"
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* <div>
            <label className="block mb-1">Venue Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full border rounded-md p-2"
            />
          </div> */}

        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white rounded-md p-3"
      >
        Submit Venue
      </button>

    </form>
    </div>
  )
}

export default page