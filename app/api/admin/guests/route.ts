import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import Papa from "papaparse";

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  tableId: z.number().optional().nullable(),
  seatNumber: z.number().optional().nullable(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().optional(),
  invitedToTea: z.boolean().optional(),
  invitedToCeremony: z.boolean().optional(),
  invitedToReception: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const guests = await prisma.guest.findMany({
      include: { table: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return NextResponse.json({ guests });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();

    if (body.action === "import-csv") {
      const { csv } = body;
      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
      });

      const guests = parsed.data as Record<string, string>[];
      const created = [];

      for (const row of guests) {
        const data = {
          firstName: row.firstName || row["First Name"] || "",
          lastName: row.lastName || row["Last Name"] || "",
          phone: row.phone || row["Phone"] || null,
          email: row.email || row["Email"] || null,
          seatNumber: row.seatNumber || row["Seat Number"] ? parseInt(row.seatNumber || row["Seat Number"]) : null,
          plusOne: row.plusOne === "true" || row["Plus One"] === "true",
          plusOneName: row.plusOneName || row["Plus One Name"] || null,
          invitedToTea: row.invitedToTea === "true" || row["Invited To Tea"] === "true",
          invitedToCeremony: row.invitedToCeremony === "true" || row["Invited To Ceremony"] === "true",
          invitedToReception: row.invitedToReception === "false" || row["Invited To Reception"] === "false" ? false : true,
          notes: row.notes || row["Notes"] || null,
        };

        if (data.firstName && data.lastName) {
          const guest = await prisma.guest.create({ data });
          created.push(guest);
        }
      }

      return NextResponse.json({ success: true, count: created.length });
    }

    const parsed = guestSchema.parse(body);
    const guest = await prisma.guest.create({
      data: {
        ...parsed,
        tableId: parsed.tableId ?? null,
        seatNumber: parsed.seatNumber ?? null,
      },
      include: { table: true },
    });

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error("Guest POST error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { id, ...data } = body;

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        ...data,
        tableId: data.tableId ?? null,
        seatNumber: data.seatNumber ?? null,
      },
      include: { table: true },
    });

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error("Guest PATCH error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.guest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guest DELETE error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
