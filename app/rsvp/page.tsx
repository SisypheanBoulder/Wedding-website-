"use client";

import { useState } from "react";
import Link from "next/link";

interface GuestMatch {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  tableId: number | null;
  seatNumber: number | null;
  plusOne: boolean;
  plusOneName: string | null;
  invitedToTea: boolean;
  invitedToCeremony: boolean;
  invitedToReception: boolean;
  rsvpStatus: string;
  table: { name: string } | null;
}

export default function RsvpPage() {
  const [step, setStep] = useState<"lookup" | "select" | "details" | "success">("lookup");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [matches, setMatches] = useState<GuestMatch[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestMatch | null>(null);
  const [attending, setAttending] = useState(true);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [plusOneName, setPlusOneName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup",
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        }),
      });

      const data = await res.json();
      if (data.matches?.length > 0) {
        setMatches(data.matches);
        setStep("select");
      } else {
        setError("No matching guest found. Please check your details and try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGuest) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          guestId: selectedGuest.id,
          attending,
          dietaryNotes,
          plusOneName: selectedGuest.plusOne ? plusOneName : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedGuest(data.guest);
        // Save guest ID in a persistent cookie (1 year expiry)
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        document.cookie = `wedding-guest-id=${data.guest.id}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
        setStep("success");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-xl mx-auto px-4 py-16">
        <Link href="/" className="text-stone-500 hover:text-stone-700 text-sm mb-8 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-4xl font-serif text-stone-900 mb-2">RSVP</h1>
        <p className="text-stone-500 mb-8">We can&apos;t wait to celebrate with you!</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
        )}

        {step === "lookup" && (
          <form onSubmit={handleLookup} className="space-y-4 bg-white p-8 rounded-xl shadow-sm">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Phone Number <span className="text-stone-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Find My Invitation"}
            </button>
          </form>
        )}

        {step === "select" && (
          <div className="space-y-4">
            <p className="text-stone-600">We found the following matches. Please select yourself:</p>
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => {
                  setSelectedGuest(match);
                  setStep("details");
                }}
                className="w-full text-left bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-stone-100"
              >
                <div className="font-serif text-lg text-stone-900">
                  {match.firstName} {match.lastName}
                </div>
                {match.phone && <div className="text-sm text-stone-500">{match.phone}</div>}
                {match.email && <div className="text-sm text-stone-500">{match.email}</div>}
                {match.rsvpStatus !== "pending" && (
                  <div className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                    match.rsvpStatus === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    Already {match.rsvpStatus}
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={() => setStep("lookup")}
              className="text-stone-500 hover:text-stone-700 text-sm"
            >
          ← Search again
            </button>
          </div>
        )}

        {step === "details" && selectedGuest && (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-xl shadow-sm">
            <div className="pb-4 border-b border-stone-100">
              <div className="font-serif text-xl text-stone-900">
                {selectedGuest.firstName} {selectedGuest.lastName}
              </div>
              {selectedGuest.table && (
                <div className="text-sm text-stone-500">
                  Assigned to {selectedGuest.table.name}
                  {selectedGuest.seatNumber && `, Seat ${selectedGuest.seatNumber}`}
                </div>
              )}
            </div>

            <div className="bg-stone-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-stone-700 mb-2">You are invited to:</h4>
              <div className="space-y-1">
                {selectedGuest.invitedToTea && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Tea Ceremony — 1:00 PM
                  </div>
                )}
                {selectedGuest.invitedToCeremony && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="w-2 h-2 bg-stone-500 rounded-full"></span>
                    Vow Ceremony — 3:00 PM
                  </div>
                )}
                {selectedGuest.invitedToReception && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Reception — 6:00 PM
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-2">All events at The Garden Estate</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Will you be attending?</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAttending(true)}
                  className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                    attending
                      ? "border-stone-800 bg-stone-800 text-white"
                      : "border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  Joyfully Accept
                </button>
                <button
                  type="button"
                  onClick={() => setAttending(false)}
                  className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                    !attending
                      ? "border-stone-800 bg-stone-800 text-white"
                      : "border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  Regretfully Decline
                </button>
              </div>
            </div>

            {attending && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Dietary Restrictions / Allergies
                  </label>
                  <textarea
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                    rows={3}
                    placeholder="Vegetarian, nut allergy, etc."
                  />
                </div>
                {selectedGuest.plusOne && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Plus One Name
                    </label>
                    <input
                      type="text"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                      placeholder="Name of your guest"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit RSVP"}
            </button>
          </form>
        )}

        {step === "success" && selectedGuest && (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-stone-900 mb-2">
              {selectedGuest.rsvpStatus === "confirmed" ? "Thank You!" : "Response Recorded"}
            </h2>
            <p className="text-stone-600 mb-6">
              {selectedGuest.rsvpStatus === "confirmed"
                ? `We can't wait to see you, ${selectedGuest.firstName}!`
                : `We're sorry you can't make it, ${selectedGuest.firstName}.`}
            </p>
            {selectedGuest.rsvpStatus === "confirmed" && selectedGuest.table && (
              <div className="bg-stone-50 p-4 rounded-lg mb-6">
                <p className="text-stone-700 font-medium">
                  Your Table: {selectedGuest.table.name}
                </p>
                {selectedGuest.seatNumber && (
                  <p className="text-stone-500">Seat {selectedGuest.seatNumber}</p>
                )}
                <Link href="/find-my-seat" className="text-stone-600 underline text-sm mt-2 inline-block">
                  View the venue map
                </Link>
              </div>
            )}
            <Link href="/" className="text-stone-500 hover:text-stone-700">
              Return to homepage
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
