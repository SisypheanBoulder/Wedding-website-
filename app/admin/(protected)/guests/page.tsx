"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  tableId: number | null;
  seatNumber: number | null;
  plusOne: boolean;
  plusOneName: string | null;
  dietaryNotes: string | null;
  notes: string | null;
  rsvpStatus: string;
  table: { name: string } | null;
}

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [csvText, setCsvText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    plusOne: false,
    notes: "",
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  async function fetchGuests() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guests");
      const data = await res.json();
      setGuests(data.guests || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this guest?")) return;
    try {
      await fetch(`/api/admin/guests?id=${id}`, { method: "DELETE" });
      fetchGuests();
    } catch {
      alert("Failed to delete guest");
    }
  }

  async function handleImport() {
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import-csv", csv: csvText }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Imported ${data.count} guests`);
        setShowImport(false);
        setCsvText("");
        fetchGuests();
      } else {
        alert(data.error || "Import failed");
      }
    } catch {
      alert("Import failed");
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    try {
      const res = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        setEditing(null);
        fetchGuests();
      }
    } catch {
      alert("Failed to save");
    }
  }

  async function handleAdd() {
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGuest),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewGuest({ firstName: "", lastName: "", phone: "", email: "", plusOne: false, notes: "" });
        fetchGuests();
      }
    } catch {
      alert("Failed to add guest");
    }
  }

  function exportCSV() {
    const headers = ["firstName", "lastName", "phone", "email", "plusOne", "plusOneName", "rsvpStatus", "table", "seatNumber", "dietaryNotes", "notes"];
    const rows = guests.map((g) => [
      g.firstName,
      g.lastName,
      g.phone || "",
      g.email || "",
      g.plusOne ? "true" : "false",
      g.plusOneName || "",
      g.rsvpStatus,
      g.table?.name || "",
      g.seatNumber || "",
      g.dietaryNotes || "",
      g.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guests.csv";
    a.click();
  }

  const filtered = guests.filter((g) => {
    const matchesSearch =
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone?.includes(search) ?? false) ||
      (g.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === "all" || g.rsvpStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-100 text-green-700",
      declined: "bg-red-100 text-red-700",
      pending: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-stone-500 hover:text-stone-700 text-sm">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-serif text-stone-900 mt-1">Guest Management</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors text-sm"
            >
              Import CSV
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm"
            >
              Add Guest
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        {showImport && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-medium text-stone-900 mb-2">Import Guests from CSV</h3>
            <p className="text-sm text-stone-500 mb-3">
              Paste CSV data with headers: firstName, lastName, phone, email, seatNumber, plusOne, plusOneName, notes
            </p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 font-mono text-sm"
              rows={6}
              placeholder={`firstName,lastName,phone\nJohn,Doe,555-1234\nJane,Smith,555-5678`}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm"
              >
                Import
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showAdd && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-medium text-stone-900 mb-4">Add New Guest</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                placeholder="First Name"
                value={newGuest.firstName}
                onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Last Name"
                value={newGuest.lastName}
                onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Phone"
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Email"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={newGuest.plusOne}
                  onChange={(e) => setNewGuest({ ...newGuest, plusOne: e.target.checked })}
                />
                Plus One
              </label>
              <input
                placeholder="Notes"
                value={newGuest.notes}
                onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {editing && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-medium text-stone-900 mb-4">Edit Guest</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                placeholder="First Name"
                value={editing.firstName}
                onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Last Name"
                value={editing.lastName}
                onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Phone"
                value={editing.phone || ""}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Email"
                value={editing.email || ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Seat Number"
                type="number"
                value={editing.seatNumber || ""}
                onChange={(e) => setEditing({ ...editing, seatNumber: e.target.value ? parseInt(e.target.value) : null })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                placeholder="Dietary Notes"
                value={editing.dietaryNotes || ""}
                onChange={(e) => setEditing({ ...editing, dietaryNotes: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-stone-200 h-14 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-100 text-stone-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Table</th>
                    <th className="text-left px-4 py-3 font-medium">Seat</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((guest) => (
                    <tr key={guest.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">
                          {guest.firstName} {guest.lastName}
                        </div>
                        {guest.plusOne && (
                          <div className="text-xs text-stone-400">+1 {guest.plusOneName || ""}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        <div>{guest.phone || "—"}</div>
                        <div className="text-xs">{guest.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(guest.rsvpStatus)}</td>
                      <td className="px-4 py-3 text-stone-600">{guest.table?.name || "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{guest.seatNumber || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditing(guest)}
                          className="text-stone-500 hover:text-stone-700 text-xs mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(guest.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-stone-500">No guests found.</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
