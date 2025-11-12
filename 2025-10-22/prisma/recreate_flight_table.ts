import { PrismaClient } from "../prisma/client/client.ts";

const prisma = new PrismaClient();

async function main(){
  console.log("Recreating Flight and _PassengerFlights tables to match schema.prisma...");
  const sql = `
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS "_PassengerFlights";
    DROP TABLE IF EXISTS "Flight";

    CREATE TABLE "Flight" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "flightNumber" TEXT NOT NULL,
      "departureTime" DATETIME NOT NULL,
      "arrivalTime" DATETIME NOT NULL,
      "aircraftId" TEXT NOT NULL,
      "airlineId" TEXT NOT NULL,
      "departureAirportId" TEXT NOT NULL,
      "arrivalAirportId" TEXT NOT NULL,
      CONSTRAINT "Flight_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Flight_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Flight_departureAirportId_fkey" FOREIGN KEY ("departureAirportId") REFERENCES "Airport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Flight_arrivalAirportId_fkey" FOREIGN KEY ("arrivalAirportId") REFERENCES "Airport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Flight_flightNumber_key" ON "Flight"("flightNumber");

    CREATE TABLE IF NOT EXISTS "_PassengerFlights" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      CONSTRAINT "_PassengerFlights_A_fkey" FOREIGN KEY ("A") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "_PassengerFlights_B_fkey" FOREIGN KEY ("B") REFERENCES "Passenger" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "_PassengerFlights_AB_unique" ON "_PassengerFlights"("A", "B");
    CREATE INDEX IF NOT EXISTS "_PassengerFlights_B_index" ON "_PassengerFlights"("B");
    PRAGMA foreign_keys = ON;
  `;

  const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      console.error("Warning executing statement:", String(e));
    }
  }
  console.log("Recreated Flight tables.");
}

main().finally(async ()=>{ await prisma.$disconnect(); });
