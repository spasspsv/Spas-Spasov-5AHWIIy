import { PrismaClient } from "../prisma/client/client.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying migration SQL to database...");
  const migrationUrl = new URL("./migrations/20251022125858_first_prototype/migration.sql", import.meta.url);
  console.log("Resolved migration URL:", migrationUrl.href);
  const migrationPath = migrationUrl.pathname.replace(/^\/[A-Za-z]:/, (m) => m.slice(1));
  console.log("Resolved migration path (fixed):", migrationPath);
  const sql = await Deno.readTextFile(migrationPath);
  // Split SQL into statements and execute them one-by-one. Some runtimes don't accept multi-statement strings.
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const [i, stmt] of statements.entries()) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed statement ${i + 1}/${statements.length}`);
    } catch (e) {
      console.error(`Error executing statement ${i + 1}:`, String(e));
      // continue with next statement
    }
  }
  console.log("Migration applied (attempted all statements).");
}

main()
  .catch((e) => {
    console.error(e);
    Deno.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
