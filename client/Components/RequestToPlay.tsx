
"use client";

import { useState } from "react";
import { createMatchRequest } from "@/services/playerDashboard";

const RequestToPlay = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [preferredSport, setPreferredSport] = useState("");
  const [date, setDate] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [budget, setBudget] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Karachi",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!preferredSport || !date || !availableFrom || !availableUntil || !budget) {
      setError("Please fill in all fields.");
      return;
    }

    const from = new Date(`${date}T${availableFrom}:00+05:00`);
    const until = new Date(`${date}T${availableUntil}:00+05:00`);

    if (from <= new Date()) {
      setError("Please select a future availability time.");
      return;
    }

    if (until <= from) {
      setError("Available until time must be later than available from time.");
      return;
    }

    if (Number(budget) < 0) {
      setError("Budget cannot be negative.");
      return;
    }

    try {
      setLoading(true);

      await createMatchRequest({
        preferredSport,
        availableFrom: from.toISOString(),
        availableUntil: until.toISOString(),
        budget: Number(budget),
      });

      setSuccess("Your request to play has been submitted!");

      setPreferredSport("");
      setDate("");
      setAvailableFrom("");
      setAvailableUntil("");
      setBudget("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to submit your request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError("");
          setSuccess("");
        }}
        className="rounded-full bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
      >
        + Request to Play
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Request to Play
              </h2>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-2xl text-gray-500 hover:text-black"
              >
                &times;
              </button>
            </div>

            {success ? (
              <div>
                <p className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  {success}
                </p>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Preferred Sport
                  </label>

                  <select
                    value={preferredSport}
                    onChange={(e) => setPreferredSport(e.target.value)}
                    className="w-full rounded-lg border p-3 outline-none focus:border-black"
                    required
                  >
                    <option value="">Select a sport</option>
                    <option value="CRICKET">Cricket</option>
                    <option value="FOOTBALL">Football</option>
                    <option value="BADMINTON">Badminton</option>
                    <option value="TENNIS">Tennis</option>
                    <option value="BASKETBALL">Basketball</option>
                    <option value="VOLLEYBALL">Volleyball</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Available Date
                  </label>

                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border p-3 outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Available From
                    </label>

                    <input
                      type="time"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Available Until
                    </label>

                    <input
                      type="time"
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                      className="w-full rounded-lg border p-3 outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Budget (PKR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter your budget"
                    className="w-full rounded-lg border p-3 outline-none focus:border-black"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>

              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RequestToPlay;
