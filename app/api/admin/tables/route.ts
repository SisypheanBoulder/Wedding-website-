import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const tableSchema = z.object({
  name: z.string().min(1),
  shape: z.enum(["round", "rectangle"]),
  seats: z.number().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const tables = await prisma.table.findMany({
      include: { guests: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ tables });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = tableSchema.parse(body);

    const table = await prisma.table.create({
      data: parsed,
      include: { guests: true },
    });

    return NextResponse.json({ success: true, table });
  } catch (error) {
    console.error("Table POST error:", error);
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

    const table = await prisma.table.update({
      where: { id },
      data,
      include: { guests: true },
    });

    return NextResponse.json({ success: true, table });
  } catch (error) {
    console.error("Table PATCH error:", error);
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

    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Table DELETE error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
