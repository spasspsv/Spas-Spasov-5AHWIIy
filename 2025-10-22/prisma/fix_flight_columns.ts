import { PrismaClient } from "../prisma/client/client.ts";

const prisma = new PrismaClient();

async function main(){
  console.log("Fixing Flight table columns...");
  try{
    // Add arrivalTime column to match current Prisma schema. Use a safe default ISO timestamp.
    await prisma.$executeRawUnsafe("ALTER TABLE \"Flight\" ADD COLUMN \"arrivalTime\" DATETIME NOT NULL DEFAULT '1970-01-01T00:00:00Z';");
    console.log("Added arrivalTime column to Flight table");
  }catch(e){
    console.log("Could not add arrivalTime column (it may already exist):", String(e));
  }
}

main().finally(async ()=>{ await prisma.$disconnect(); });
