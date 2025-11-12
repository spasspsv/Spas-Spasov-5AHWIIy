import { PrismaClient } from "model";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database (this may take a while)...");

    // Wipe existing data (order matters because of FK constraints)
    await prisma.flight.deleteMany();
    await prisma.aircraft.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.airport.deleteMany();
    await prisma.airline.deleteMany();

    // 1) Create 100 Airports
        const airports: { id: string; iataCode: string }[] = [];
    const usedIatas = new Set<string>();
    while (airports.length < 20) {
        const city = faker.location.city();
        const name = `${city} ${faker.company.name().split(" ")[0]} Airport`;
        // ensure a 3-letter IATA code
        const iata = faker.string.alpha({ length: 3 }).toUpperCase();
        if (usedIatas.has(iata)) continue;
        usedIatas.add(iata);
        const a = await prisma.airport.create({ data: { name, iataCode: iata, city } });
        airports.push({ id: a.id, iataCode: a.iataCode });
    }
    console.log(`Created ${airports.length} airports`);

    // 2) Create a few Airlines (needed for Aircraft and Flight relations)
        const airlines: { id: string }[] = [];
    for (let i = 0; i < 8; i++) {
        const name = `${faker.company.name()} Airlines`;
        const al = await prisma.airline.create({ data: { name } });
        airlines.push({ id: al.id });
    }
    console.log(`Created ${airlines.length} airlines`);

    // 3) Create 250 Aircrafts (each needs Hangar_AirportId and AirlineId)
    const planeModels = [
        "Boeing 737-800","Airbus A320","Boeing 777-300","Airbus A330-300","Boeing 787-9",
        "Embraer E195","Bombardier CRJ900","Airbus A350-900","Boeing 747-400","Boeing 767-300",
        "Airbus A321neo","Boeing 737 MAX 8","Airbus A220-300","Boeing 757-200","Airbus A319",
        "Bombardier Dash 8","Embraer E175","Airbus A380-800","Boeing 737-700","Sukhoi Superjet 100"
    ];
        const aircrafts: { id: string; capacity: number; airlineId: string }[] = [];
    for (let i = 0; i < 250; i++) {
        const model = planeModels[i % planeModels.length];
        const capacity = faker.number.int({ min: 70, max: 500 });
        const hangar = airports[faker.number.int({ min: 0, max: airports.length - 1 })];
        const airline = airlines[faker.number.int({ min: 0, max: airlines.length - 1 })];
        const ac = await prisma.aircraft.create({
            data: {
                model,
                capacity,
                Hangar_AirportId: hangar.id,
                AirlineId: airline.id
            }
        });
        aircrafts.push({ id: ac.id, capacity: ac.capacity, airlineId: airline.id });
    }
    console.log(`Created ${aircrafts.length} aircrafts`);

    // 4) Create 20000 Passengers in batches
    const totalPassengers = 20000;
    const batchSize = 1000;
        for (let offset = 0; offset < totalPassengers; offset += batchSize) {
            type PassengerCreateInput = { firstName: string; lastName: string; email: string };
            const batch: PassengerCreateInput[] = [];
        const limit = Math.min(batchSize, totalPassengers - offset);
        for (let i = 0; i < limit; i++) {
            const idx = offset + i;
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            // make sure email is unique by embedding the index
            const email = `${firstName}.${lastName}.${idx}@example.com`.toLowerCase();
            batch.push({ firstName, lastName, email });
        }
    // createMany typing in the generated client can be strict; cast via unknown to a compatible signature
    await (prisma.passenger as unknown as { createMany(args: { data: PassengerCreateInput[] }): Promise<unknown> }).createMany({ data: batch });
        console.log(`Inserted ${Math.min(offset + batchSize, totalPassengers)} / ${totalPassengers} passengers`);
    }

    const passengerCount = await prisma.passenger.count();
    console.log(`Total passengers in DB: ${passengerCount}`);

    // fetch passenger ids for connections
        const allPassengers: { id: string }[] = await prisma.passenger.findMany({ select: { id: true } });
            const passengerIds: string[] = allPassengers.map(p => p.id);

    // 5) Create 5000 Flights and connect passengers
    for (let i = 0; i < 5000; i++) {
        const aircraft = aircrafts[faker.number.int({ min: 0, max: aircrafts.length - 1 })];
        // choose origin and destination airports (not equal)
        const originIdx = faker.number.int({ min: 0, max: airports.length - 1 });
        let destIdx = faker.number.int({ min: 0, max: airports.length - 1 });
        if (originIdx === destIdx) destIdx = (destIdx + 1) % airports.length;
        const origin = airports[originIdx];
        const destination = airports[destIdx];

        const now = new Date();
        const departure = new Date(now.getTime() + faker.number.int({ min: 0, max: 90 * 24 * 60 * 60 * 1000 }));
        const durationMs = faker.number.int({ min: 30 * 60 * 1000, max: 12 * 60 * 60 * 1000 });
        const arrival = new Date(departure.getTime() + durationMs);

        const flightNumber = `FL${i}${faker.number.int({ min: 100, max: 9999 })}`;

        const flight = await prisma.flight.create({
            data: {
                flightNumber,
                departureTime: departure,
                arrivalTime: arrival,
                aircraftId: aircraft.id,
                airlineId: aircraft.airlineId,
                departureAirportId: origin.id,
                arrivalAirportId: destination.id
            }
        });

        // attach random passengers (sample without duplicates)
        const cap = aircraft.capacity ?? 150;
        const countForFlight = faker.number.int({ min: Math.max(1, Math.floor(cap * 0.1)), max: Math.min(cap, 300) });
        const selected = new Set<string>();
        while (selected.size < countForFlight && selected.size < passengerIds.length) {
            const idx = faker.number.int({ min: 0, max: passengerIds.length - 1 });
            selected.add(passengerIds[idx]);
        }
        if (selected.size > 0) {
            await prisma.flight.update({
                where: { id: flight.id },
                data: { Passenger: { connect: Array.from(selected).map(id => ({ id })) } }
            });
        }

    // log progress every 100 flights
    if ((i + 1) % 100 === 0) console.log(`Created ${i + 1} flights`);
    }

    console.log("Seeding finished");
}

main()
    .catch((e) => {
        console.error(e);
        Deno.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });