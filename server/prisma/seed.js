
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@sweety.local";
  const password = "SweetyDemo123!";

  // Hash the demo user's password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the demo user if it doesn't already exist
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Sweety Demo User",
      email,
      password: hashedPassword,
    },
  });

  console.log("Demo user is ready.");

  // Sample glucose readings for the last 7 days
  const sampleData = [
    { daysAgo: 6, values: [98, 142, 132, 118] },
    { daysAgo: 5, values: [102, 145, 135, 120] },
    { daysAgo: 4, values: [95, 138, 128, 115] },
    { daysAgo: 3, values: [105, 150, 140, 125] },
    { daysAgo: 2, values: [100, 144, 134, 119] },
    { daysAgo: 1, values: [96, 139, 130, 116] },
    { daysAgo: 0, values: [101, 146, 136, 122] },
  ];

  const timeSlots = [
    "MORNING",
    "AFTER_BREAKFAST",
    "AFTER_LUNCH",
    "AFTER_DINNER",
  ];

  let createdCount = 0;

  for (const day of sampleData) {
    const today = new Date();

    const readingDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - day.daysAgo
      )
    );

    for (let i = 0; i < timeSlots.length; i++) {
      await prisma.glucoseReading.upsert({
        where: {
          userId_date_timeSlot: {
            userId: user.id,
            date: readingDate,
            timeSlot: timeSlots[i],
          },
        },
        update: {
          value: day.values[i],
        },
        create: {
          userId: user.id,
          date: readingDate,
          timeSlot: timeSlots[i],
          value: day.values[i],
        },
      });

      createdCount++;
    }
  }

  console.log("Sample glucose readings are ready.");
  console.log(`Processed ${createdCount} sample readings.`);
  console.log("--------------------------------");
  console.log("Demo login credentials:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("--------------------------------");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
