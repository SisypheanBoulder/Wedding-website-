"use client";

import { useEffect, useState } from "react";

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

interface TableMapProps {
  highlightTableId?: number | null;
  interactive?: boolean;
  onTableClick?: (table: TableData) => void;
}

export default function TableMap({ highlightTableId, interactive, onTableClick }: TableMapProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);

  useEffect(() => {
    fetch("/api/admin/tables")
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="bg-stone-100 rounded-xl h-96 animate-pulse" />;
  }

  if (tables.length === 0) {
    return (
      <div className="bg-stone-100 rounded-xl p-8 text-center">
        <p className="text-stone-500">No tables have been set up yet.</p>
      </div>
    );
  }

  const mapWidth = 800;
  const mapHeight = 600;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <h3 className="font-serif text-lg text-stone-900">Venue Layout</h3>
        {highlightTableId && (
          <span className="text-sm text-stone-500">Your table is highlighted</span>
        )}
      </div>
      <div className="overflow-auto">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-auto min-h-[400px]"
          style={{ background: "#f5f5f4" }}
        >
          {/* Grid lines */}
          {Array.from({ length: 21 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * (mapWidth / 20)}
              y1={0}
              x2={i * (mapWidth / 20)}
              y2={mapHeight}
              stroke="#e7e5e4"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * (mapHeight / 15)}
              x2={mapWidth}
              y2={i * (mapHeight / 15)}
              stroke="#e7e5e4"
              strokeWidth={0.5}
            />
          ))}

          {tables.map((table) => {
            const isHighlighted = table.id === highlightTableId;
            const isSelected = selectedTable?.id === table.id;
            const cx = (table.x / 100) * mapWidth;
            const cy = (table.y / 100) * mapHeight;
            const w = (table.width / 100) * mapWidth;
            const h = (table.height / 100) * mapHeight;

            return (
              <g
                key={table.id}
                transform={`rotate(${table.rotation}, ${cx}, ${cy})`}
                className={interactive || onTableClick ? "cursor-pointer" : ""}
                onClick={() => {
                  if (interactive || onTableClick) {
                    setSelectedTable(table);
                    onTableClick?.(table);
                  }
                }}
              >
                {table.shape === "round" ? (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={Math.max(w, h) / 2}
                      fill={isHighlighted ? "#d6d3d1" : isSelected ? "#e7e5e4" : "#ffffff"}
                      stroke={isHighlighted ? "#78716c" : "#a8a29e"}
                      strokeWidth={isHighlighted ? 3 : 2}
                      className={isHighlighted ? "animate-pulse" : ""}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-stone-700 pointer-events-none"
                      style={{ fontSize: "12px", fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {table.name}
                    </text>
                    <text
                      x={cx}
                      y={cy + 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-stone-500 pointer-events-none"
                      style={{ fontSize: "10px", fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {table.guests.length}/{table.seats}
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x={cx - w / 2}
                      y={cy - h / 2}
                      width={w}
                      height={h}
                      rx={4}
                      fill={isHighlighted ? "#d6d3d1" : isSelected ? "#e7e5e4" : "#ffffff"}
                      stroke={isHighlighted ? "#78716c" : "#a8a29e"}
                      strokeWidth={isHighlighted ? 3 : 2}
                      className={isHighlighted ? "animate-pulse" : ""}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-stone-700 pointer-events-none"
                      style={{ fontSize: "12px", fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {table.name}
                    </text>
                    <text
                      x={cx}
                      y={cy + 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-stone-500 pointer-events-none"
                      style={{ fontSize: "10px", fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {table.guests.length}/{table.seats}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedTable && (
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <h4 className="font-medium text-stone-900 mb-2">{selectedTable.name} — Guests</h4>
          {selectedTable.guests.length === 0 ? (
            <p className="text-sm text-stone-500">No guests assigned yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedTable.guests.map((g) => (
                <div key={g.id} className="text-sm text-stone-600 bg-white px-3 py-2 rounded">
                  {g.firstName} {g.lastName}
                  {g.seatNumber && <span className="text-stone-400 ml-1">(Seat {g.seatNumber})</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
