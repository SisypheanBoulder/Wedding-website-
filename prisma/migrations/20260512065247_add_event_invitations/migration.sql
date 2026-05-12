-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "tableId" INTEGER,
    "seatNumber" INTEGER,
    "plusOne" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "dietaryNotes" TEXT,
    "invitedToTea" BOOLEAN NOT NULL DEFAULT false,
    "invitedToCeremony" BOOLEAN NOT NULL DEFAULT false,
    "invitedToReception" BOOLEAN NOT NULL DEFAULT true,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'pending',
    "rsvpDate" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Guest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("dietaryNotes", "email", "firstName", "id", "lastName", "notes", "phone", "plusOne", "plusOneName", "rsvpDate", "rsvpStatus", "seatNumber", "tableId") SELECT "dietaryNotes", "email", "firstName", "id", "lastName", "notes", "phone", "plusOne", "plusOneName", "rsvpDate", "rsvpStatus", "seatNumber", "tableId" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
