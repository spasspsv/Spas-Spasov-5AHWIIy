import { PrismaClient } from "../prisma/client/client.ts";

const prisma = new PrismaClient();

async function main(){
  const res = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table';");
  console.log(res);
}

main().finally(async ()=>{ await prisma.$disconnect(); });
