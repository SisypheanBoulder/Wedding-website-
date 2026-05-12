"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  tables: number;
  seated: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/guests").then((r) => r.json()),
      fetch("/api/admin/tables").then((r) => r.json()),
    ])
      .then(([guestsData, tablesData]) => {
        const guests = guestsData.guests || [];
        const tables = tablesData.tables || [];
        setStats({
          total: guests.length,
          confirmed: guests.filter((g: { rsvpStatus: string }) => g.rsvpStatus === "confirmed").length,
          declined: guests.filter((g: { rsvpStatus: string }) => g.rsvpStatus === "declined").length,
          pending: guests.filter((g: { rsvpStatus: string }) => g.rsvpStatus === "pending").length,
          tables: tables.length,
          seated: guests.filter((g: { tableId: number | null }) => g.tableId !== null).length,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const statCards = stats
    ? [
        { label: "Total Guests", value: stats.total, color: "bg-stone-800 text-white" },
        { label: "Confirmed", value: stats.confirmed, color: "bg-green-700 text-white" },
        { label: "Declined", value: stats.declined, color: "bg-red-700 text-white" },
        { label: "Pending", value: stats.pending, color: "bg-amber-600 text-white" },
        { label: "Tables", value: stats.tables, color: "bg-stone-600 text-white" },
        { label: "Seated", value: stats.seated, color: "bg-stone-500 text-white" },
      ]
    : [];

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-stone-900">Dashboard</h1>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-stone-200 rounded-lg h-24 animate-pulse" />
              ))
            : statCards.map((card) => (
                <div key={card.label} className={`${card.color} rounded-lg p-4`}>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="text-sm opacity-80">{card.label}</div>
                </div>
              ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/guests"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-stone-900 mb-1">Guest Management</h2>
            <p className="text-stone-500 text-sm">Add, edit, import, and manage your guest list.</p>
          </Link>

          <Link
            href="/admin/tables"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-stone-900 mb-1">Table Layout</h2>
            <p className="text-stone-500 text-sm">Design the venue map and assign guests to tables.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
