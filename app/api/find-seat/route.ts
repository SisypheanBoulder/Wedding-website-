import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  guestId: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const guests = await prisma.guest.findMany({
      where: {
        rsvpStatus: "confirmed",
      },
      include: { table: true },
    });

    if (guests.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    if (parsed.guestId) {
      const guest = guests.find((g) => g.id === parsed.guestId);
      if (guest) {
        return NextResponse.json({ matches: [guest] });
      }
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
  } catch (error) {
    console.error("Find seat error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
