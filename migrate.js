import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Initialize Prisma Client for the old and new database
const oldDb = new PrismaClient({
  datasources: { db: { url: process.env.OLD_DATABASE_URL } },
});

const newDb = new PrismaClient({
  datasources: { db: { url: process.env.NEW_DATABASE_URL } },
});

async function migrateData() {
  // Migrate UserVerification data
  const userVerifications = await oldDb.userVerification.findMany();
  for (const verification of userVerifications) {
    await newDb.userVerification
      .create({
        data: verification,
      })
      .catch((err) =>
        console.log(
          `Error migrating UserVerification ID ${verification.id}: ${err.message}`
        )
      );
  }
  console.log("UserVerification data migrated successfully.");

  // Migrate Review data
  const reviews = await oldDb.review.findMany();
  for (const review of reviews) {
    await newDb.review
      .create({
        data: review,
      })
      .catch((err) =>
        console.log(`Error migrating Review ID ${review.id}: ${err.message}`)
      );
  }
  console.log("Review data migrated successfully.");
}

await migrateData()
  .then(() => {
    console.log("Data migration completed successfully.");
    oldDb.$disconnect();
    newDb.$disconnect();
  })
  .catch((error) => {
    console.error("Data migration failed:", error);
    oldDb.$disconnect();
    newDb.$disconnect();
  });
