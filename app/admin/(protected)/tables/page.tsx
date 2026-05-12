"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TableMap from "@/components/table-map";

interface TableData {
  id: number;
  name: string;
  shape: string;
  seats: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  guests: { id: number; firstName: string; lastName: string; seatNumber: number | null }[];
}

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  tableId: number | null;
  seatNumber: number | null;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTable, setNewTable] = useState({
    name: "",
    shape: "round" as "round" | "rectangle",
    seats: 8,
    x: 50,
    y: 50,
    width: 10,
    height: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [tablesRes, guestsRes] = await Promise.all([
        fetch("/api/admin/tables"),
        fetch("/api/admin/guests"),
      ]);
      const tablesData = await tablesRes.json();
      const guestsData = await guestsRes.json();
      setTables(tablesData.tables || []);
      setGuests(guestsData.guests || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTable() {
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTable),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewTable({ name: "", shape: "round", seats: 8, x: 50, y: 50, width: 10, height: 10 });
        fetchData();
      }
    } catch {
      alert("Failed to add table");
    }
  }

  async function handleDeleteTable(id: number) {
    if (!confirm("Delete this table?")) return;
    try {
      await fetch(`/api/admin/tables?id=${id}`, { method: "DELETE" });
      setSelectedTable(null);
      fetchData();
    } catch {
      alert("Failed to delete table");
    }
  }

  async function handleUpdateTable(id: number, data: Partial<TableData>) {
    try {
      await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      fetchData();
    } catch {
      alert("Failed to update table");
    }
  }

  async function handleAssignGuest(guestId: number, tableId: number | null, seatNumber: number | null) {
    try {
      await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guestId, tableId, seatNumber }),
      });
      fetchData();
    } catch {
      alert("Failed to assign guest");
    }
  }

  const unassignedGuests = guests.filter((g) => g.tableId === null);
  const selectedTableGuests = selectedTable
    ? guests.filter((g) => g.tableId === selectedTable.id)
    : [];

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-stone-500 hover:text-stone-700 text-sm">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-serif text-stone-900 mt-1">Table Layout</h1>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm"
          >
            Add Table
          </button>
        </div>

        {showAdd && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h3 className="font-medium text-stone-900 mb-4">Add New Table</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <input
                placeholder="Table Name"
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <select
                value={newTable.shape}
                onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as "round" | "rectangle" })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
              </select>
              <input
                type="number"
                placeholder="Seats"
                value={newTable.seats}
                onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) || 0 })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                placeholder="X Position (%)"
                value={newTable.x}
                onChange={(e) => setNewTable({ ...newTable, x: parseFloat(e.target.value) })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                placeholder="Y Position (%)"
                value={newTable.y}
                onChange={(e) => setNewTable({ ...newTable, y: parseFloat(e.target.value) })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                placeholder="Width (%)"
                value={newTable.width}
                onChange={(e) => setNewTable({ ...newTable, width: parseFloat(e.target.value) })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <input
                type="number"
                placeholder="Height (%)"
                value={newTable.height}
                onChange={(e) => setNewTable({ ...newTable, height: parseFloat(e.target.value) })}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddTable}
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableMap
              interactive
              onTableClick={(table) => setSelectedTable(table)}
            />
          </div>

          <div className="space-y-6">
            {selectedTable && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-stone-900">{selectedTable.name}</h3>
                  <button
                    onClick={() => handleDeleteTable(selectedTable.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-stone-500">X</label>
                      <input
                        type="number"
                        value={selectedTable.x}
                        onChange={(e) => handleUpdateTable(selectedTable.id, { x: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-stone-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Y</label>
                      <input
                        type="number"
                        value={selectedTable.y}
                        onChange={(e) => handleUpdateTable(selectedTable.id, { y: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-stone-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Width</label>
                      <input
                        type="number"
                        value={selectedTable.width}
                        onChange={(e) => handleUpdateTable(selectedTable.id, { width: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-stone-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Height</label>
                      <input
                        type="number"
                        value={selectedTable.height}
                        onChange={(e) => handleUpdateTable(selectedTable.id, { height: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-stone-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Rotation</label>
                      <input
                        type="number"
                        value={selectedTable.rotation}
                        onChange={(e) => handleUpdateTable(selectedTable.id, { rotation: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border border-stone-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Seats</label>
                      <input
                        type="number"
                        value={selectedTable.seats}
                        onChange={(e) => handleUpdateTable(selectedTable.id, { seats: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-stone-200 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-stone-700 mb-2">
                  Assigned Guests ({selectedTableGuests.length}/{selectedTable.seats})
                </h4>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {selectedTableGuests.map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded">
                      <span className="text-sm text-stone-700">
                        {g.firstName} {g.lastName}
                        {g.seatNumber && <span className="text-stone-400 ml-1">Seat {g.seatNumber}</span>}
                      </span>
                      <button
                        onClick={() => handleAssignGuest(g.id, null, null)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {selectedTableGuests.length === 0 && (
                    <p className="text-sm text-stone-400">No guests assigned.</p>
                  )}
                </div>

                {selectedTableGuests.length < selectedTable.seats && unassignedGuests.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Add Guest</h4>
                    <select
                      onChange={(e) => {
                        const guestId = parseInt(e.target.value);
                        if (guestId) {
                          handleAssignGuest(guestId, selectedTable.id, selectedTableGuests.length + 1);
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    >
                      <option value="">Select unassigned guest...</option>
                      {unassignedGuests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.firstName} {g.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-stone-900 mb-3">Unassigned Guests</h3>
              <div className="space-y-2 max-h-64 overflow-auto">
                {unassignedGuests.length === 0 ? (
                  <p className="text-sm text-stone-400">All guests are assigned!</p>
                ) : (
                  unassignedGuests.map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded">
                      <span className="text-sm text-stone-700">{g.firstName} {g.lastName}</span>
                      {tables.length > 0 && (
                        <select
                          onChange={(e) => {
                            const tableId = parseInt(e.target.value);
                            if (tableId) {
                              const table = tables.find((t) => t.id === tableId);
                              const currentGuests = guests.filter((guest) => guest.tableId === tableId).length;
                              if (table && currentGuests < table.seats) {
                                handleAssignGuest(g.id, tableId, currentGuests + 1);
                              }
                              e.target.value = "";
                            }
                          }}
                          className="text-xs px-2 py-1 border border-stone-200 rounded"
                        >
                          <option value="">Assign...</option>
                          {tables.map((t) => {
                            const currentGuests = guests.filter((guest) => guest.tableId === t.id).length;
                            return (
                              <option key={t.id} value={t.id} disabled={currentGuests >= t.seats}>
                                {t.name} ({currentGuests}/{t.seats})
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
