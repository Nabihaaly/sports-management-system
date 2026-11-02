
"use client";

import { useEffect, useState } from "react";

import {
  getReceivedFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  ReceivedFriendRequest,
} from "../services/playerProfile";

import {
  getSplitInvitations,
  acceptSplitInvitation,
  declineSplitInvitation,
} from "../services/playerDashboard";

type SplitInvitation = {
  bookingId: string;
  creatorName: string;
  amountPKR: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  courtName: string;
  venueName: string;
  address: string;
  city: string;
  invitationExpiresAt: string;
};

export default function PlayersNotifications() {
  const [isOpen, setIsOpen] = useState(false);

  // Existing friend request state
  const [friendRequests, setFriendRequests] = useState<
    ReceivedFriendRequest[]
  >([]);

  // Split booking invitation state
  const [splitInvitations, setSplitInvitations] = useState<
    SplitInvitation[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const [friendResult, invitationResult] = await Promise.all([
        getReceivedFriendRequests(),
        getSplitInvitations(),
      ]);

      // Existing friend requests
      setFriendRequests(friendResult.requests || []);

      // Split invitations are returned as flat objects inside invitations.
      // The backend does not return invitationStatus, so do not filter by it.
      setSplitInvitations(invitationResult.invitations || []);

      console.log("Split invitation API response:", invitationResult);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications whenever the dropdown is opened.
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Accept an existing friend request
  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);

      await acceptFriendRequest(requestId);

      setFriendRequests((previous) =>
        previous.filter((request) => request.id !== requestId)
      );
    } catch (err) {
      console.error("Error accepting friend request:", err);
      alert("Could not accept friend request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Decline an existing friend request
  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);

      await declineFriendRequest(requestId);

      setFriendRequests((previous) =>
        previous.filter((request) => request.id !== requestId)
      );
    } catch (err) {
      console.error("Error declining friend request:", err);
      alert("Could not decline friend request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Accept a split booking invitation
  const handleAcceptSplitInvitation = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);

      await acceptSplitInvitation(bookingId);

      setSplitInvitations((previous) =>
        previous.filter((invitation) => invitation.bookingId !== bookingId)
      );

      alert("Split booking invitation accepted!");
    } catch (err) {
      console.error("Error accepting split invitation:", err);
      alert("Could not accept invitation. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Decline a split booking invitation
  const handleDeclineSplitInvitation = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);

      await declineSplitInvitation(bookingId);

      setSplitInvitations((previous) =>
        previous.filter((invitation) => invitation.bookingId !== bookingId)
      );

      alert("Split booking invitation declined.");
    } catch (err) {
      console.error("Error declining split invitation:", err);
      alert("Could not decline invitation. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const totalNotifications =
    friendRequests.length + splitInvitations.length;

  return (
    <div className="relative">
      {/* Heart notification button */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl transition hover:bg-gray-100"
        aria-label="Notifications"
      >
        ❤️

        {totalNotifications > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {totalNotifications}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 max-h-[550px] w-[350px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:w-[400px]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications
            </h3>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xl text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Loading notifications...
            </p>
          ) : error ? (
            <div className="py-4 text-center">
              <p className="text-sm text-red-500">{error}</p>

              <button
                type="button"
                onClick={loadNotifications}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* SPLIT BOOKING INVITATIONS */}
              {splitInvitations.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
                    Split Booking Invitations
                  </h4>

                  <div className="space-y-3">
                    {splitInvitations.map((invitation) => (
                      <div
                        key={invitation.bookingId}
                        className="rounded-lg border border-blue-100 bg-blue-50 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-800">
                          {invitation.creatorName} invited you to a split
                          booking
                        </p>

                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Venue:</span>{" "}
                            {invitation.venueName}
                          </p>

                          <p>
                            <span className="font-medium">Court:</span>{" "}
                            {invitation.courtName}
                          </p>

                          <p>
                            <span className="font-medium">Date:</span>{" "}
                            {invitation.bookingDate}
                          </p>

                          <p>
                            <span className="font-medium">Time:</span>{" "}
                            {invitation.startTime} - {invitation.endTime}
                          </p>

                          <p>
                            <span className="font-medium">Location:</span>{" "}
                            {invitation.address}, {invitation.city}
                          </p>

                          <p className="font-semibold text-gray-800">
                            Your share: Rs. {invitation.amountPKR}
                          </p>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={processingId === invitation.bookingId}
                            onClick={() =>
                              handleAcceptSplitInvitation(
                                invitation.bookingId
                              )
                            }
                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processingId === invitation.bookingId
                              ? "Please wait..."
                              : "Accept"}
                          </button>

                          <button
                            type="button"
                            disabled={processingId === invitation.bookingId}
                            onClick={() =>
                              handleDeclineSplitInvitation(
                                invitation.bookingId
                              )
                            }
                            className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FRIEND REQUESTS */}
              {friendRequests.length > 0 && (
                <div>
                  <h4 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
                    Friend Requests
                  </h4>

                  <div className="space-y-3">
                    {friendRequests.map((request) => {
                      const sender = request.sender;
                      const profile = sender.playerProfile;

                      const displayName =
                        profile?.displayName || sender.name;

                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                        >
                          {profile?.profilePicture ? (
                            <img
                              src={profile.profilePicture}
                              alt={displayName}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-600">
                              {displayName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {displayName}
                            </p>

                            <p className="text-xs text-gray-500">
                              {profile?.city || "Friend request"}
                            </p>

                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                disabled={processingId === request.id}
                                onClick={() =>
                                  handleAcceptFriendRequest(request.id)
                                }
                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Accept
                              </button>

                              <button
                                type="button"
                                disabled={processingId === request.id}
                                onClick={() =>
                                  handleDeclineFriendRequest(request.id)
                                }
                                className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NO NOTIFICATIONS */}
              {friendRequests.length === 0 &&
                splitInvitations.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No new notifications.
                  </p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
