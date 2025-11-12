import { PrismaClient } from "../prisma/client/client.ts";

const prisma = new PrismaClient();

async function main(){
  const airports = await prisma.airport.count();
  const aircraft = await prisma.aircraft.count();
  const passengers = await prisma.passenger.count();
  const flights = await prisma.flight.count();
  console.log({ airports, aircraft, passengers, flights });
}

main().finally(async ()=>{ await prisma.$disconnect(); });
