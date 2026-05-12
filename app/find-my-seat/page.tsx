"use client";

import { useState } from "react";
import Link from "next/link";
import TableMap from "@/components/table-map";

interface GuestMatch {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  tableId: number | null;
  seatNumber: number | null;
  table: { id: number; name: string; shape: string; seats: number; x: number; y: number; width: number; height: number; rotation: number } | null;
}

export default function FindMySeatPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [matches, setMatches] = useState<GuestMatch[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch("/api/find-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        }),
      });

      const data = await res.json();
      if (data.matches?.length > 0) {
        setMatches(data.matches);
      } else {
        setMatches([]);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-stone-500 hover:text-stone-700 text-sm mb-8 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-4xl font-serif text-stone-900 mb-2">Find My Seat</h1>
        <p className="text-stone-500 mb-8">Enter your details to see where you&apos;re sitting.</p>

        {!selectedGuest ? (
          <>
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-sm mb-8">
              <div className="grid md:grid-cols-3 gap-4">
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
                    Phone <span className="text-stone-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 px-8 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Searching..." : "Find My Seat"}
              </button>
            </form>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

            {searched && matches.length === 0 && (
              <div className="bg-stone-100 p-6 rounded-xl text-center">
                <p className="text-stone-600">No confirmed guests found matching those details.</p>
                <p className="text-stone-500 text-sm mt-1">Make sure you&apos;ve already RSVP&apos;d, or try a different spelling.</p>
              </div>
            )}

            {matches.length > 0 && (
              <div className="space-y-3">
                <p className="text-stone-600">Select yourself to see your seat:</p>
                {matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedGuest(match)}
                    className="w-full text-left bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-stone-100"
                  >
                    <div className="font-serif text-lg text-stone-900">
                      {match.firstName} {match.lastName}
                    </div>
                    {match.phone && <div className="text-sm text-stone-500">{match.phone}</div>}
                    {match.table && (
                      <div className="text-sm text-stone-600 mt-1">
                        {match.table.name}
                        {match.seatNumber && ` · Seat ${match.seatNumber}`}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-serif text-stone-900">
                    {selectedGuest.firstName} {selectedGuest.lastName}
                  </h2>
                  {selectedGuest.table && (
                    <p className="text-stone-600">
                      {selectedGuest.table.name}
                      {selectedGuest.seatNumber && ` · Seat ${selectedGuest.seatNumber}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedGuest(null);
                    setSearched(false);
                    setMatches([]);
                  }}
                  className="text-stone-500 hover:text-stone-700 text-sm"
                >
                  Search again
                </button>
              </div>
            </div>

            <TableMap highlightTableId={selectedGuest.tableId} />
          </div>
        )}
      </div>
    </main>
  );
}
