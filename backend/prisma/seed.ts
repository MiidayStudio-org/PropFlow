import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Initializing clean PropFlow schema in PostgreSQL...");

  // 1. Ensure Agency
  let agency = await prisma.agency.findFirst();
  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: "PropFlow Elite Realty",
        subdomain: "propflow",
      },
    });
    console.log(`🏢 Created agency: ${agency.name}`);
  }

  // Zero dummy leads, zero dummy properties, zero dummy deals, zero dummy site visits
  console.log("✅ Database initialized clean with 0 dummy records.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
