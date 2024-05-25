import { AttachmentBuilder, Client, TextChannel } from "discord.js";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// postDataToDiscord function
async function postDataToDiscord(client: Client) {
  try {
    const userVerifications = await prisma.userVerification.findMany();
    const reviews = await prisma.review.findMany();
    const threadCounts = await prisma.threadCount.findMany();

    const jsonData = JSON.stringify(
      { userVerifications, reviews, threadCounts },
      (key, value) => (typeof value === "bigint" ? value.toString() : value)
    );
    const filePath = "./backup.json";
    fs.writeFileSync(filePath, jsonData);
    const buffer = fs.readFileSync(filePath);
    const channelName = "💾-db-backup";
    const channel = client.channels.cache.find(
      (ch) => (ch as TextChannel).name === channelName && ch.isTextBased()
    );
    if (channel) {
      const attachment = new AttachmentBuilder(buffer, {
        name: "backup.json",
      });
      await (channel as TextChannel).send({ files: [attachment] });
      console.log("Backup posted to Discord.");
    } else {
      console.log("Channel not found.");
    }

    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Failed to post data to Discord:", error);
  }
}

export { postDataToDiscord };
