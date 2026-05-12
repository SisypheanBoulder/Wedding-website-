import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";
import { z } from "zod";

const lookupSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

const submitSchema = z.object({
  guestId: z.number(),
  attending: z.boolean(),
  dietaryNotes: z.string().optional(),
  plusOneAttending: z.boolean().optional(),
  plusOneName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "lookup") {
      const parsed = lookupSchema.parse(body);
      const guests = await prisma.guest.findMany({
        include: { table: true },
      });

      if (guests.length === 0) {
        return NextResponse.json({ matches: [] });
      }

      const searchableGuests = guests.map((g) => ({
        ...g,
        searchText: `${g.firstName} ${g.lastName} ${g.phone || ""} ${g.email || ""}`.trim().toLowerCase(),
      }));

      const fuseOptions = {
        keys: ["searchText"],
        threshold: 0.3,
        includeScore: true,
        ignoreLocation: true,
      };

      const fuse = new Fuse(searchableGuests, fuseOptions);

      const queryParts: string[] = [];
      if (parsed.firstName) queryParts.push(parsed.firstName);
      if (parsed.lastName) queryParts.push(parsed.lastName);
      if (parsed.phone) queryParts.push(parsed.phone);

      const query = queryParts.join(" ").toLowerCase();
      const results = fuse.search(query);

      const matches = results
        .filter((r) => r.score !== undefined && r.score < 0.4)
        .slice(0, 5)
        .map((r) => {
          const { searchText, ...guest } = r.item;
          return {
            ...guest,
            matchScore: r.score,
          };
        });

      return NextResponse.json({ matches });
    }

    if (action === "submit") {
      const parsed = submitSchema.parse(body);
      const guest = await prisma.guest.update({
        where: { id: parsed.guestId },
        data: {
          rsvpStatus: parsed.attending ? "confirmed" : "declined",
          rsvpDate: new Date(),
          dietaryNotes: parsed.dietaryNotes || undefined,
          plusOneName: parsed.plusOneName || undefined,
        },
        include: { table: true },
      });

      return NextResponse.json({ success: true, guest });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
