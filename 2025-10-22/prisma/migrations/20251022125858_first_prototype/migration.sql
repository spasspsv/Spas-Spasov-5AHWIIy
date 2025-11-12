-- CreateTable
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capacity" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "Hangar_AirportId" TEXT NOT NULL,
    "AirlineId" TEXT NOT NULL,
    CONSTRAINT "Aircraft_Hangar_AirportId_fkey" FOREIGN KEY ("Hangar_AirportId") REFERENCES "Airport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aircraft_AirlineId_fkey" FOREIGN KEY ("AirlineId") REFERENCES "Airline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Airport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Airline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flightNumber" TEXT NOT NULL,
    "departureTime" DATETIME NOT NULL,
    "duration_s" INTEGER NOT NULL,
    "aircraftId" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "departureAirportId" TEXT NOT NULL,
    "arrivalAirportId" TEXT NOT NULL,
    CONSTRAINT "Flight_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_departureAirportId_fkey" FOREIGN KEY ("departureAirportId") REFERENCES "Airport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flight_arrivalAirportId_fkey" FOREIGN KEY ("arrivalAirportId") REFERENCES "Airport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PassengerFlights" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PassengerFlights_A_fkey" FOREIGN KEY ("A") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PassengerFlights_B_fkey" FOREIGN KEY ("B") REFERENCES "Passenger" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Airport_iataCode_key" ON "Airport"("iataCode");

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_email_key" ON "Passenger"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_name_key" ON "Airline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_flightNumber_key" ON "Flight"("flightNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_PassengerFlights_AB_unique" ON "_PassengerFlights"("A", "B");

-- CreateIndex
CREATE INDEX "_PassengerFlights_B_index" ON "_PassengerFlights"("B");
