import { PrismaClient } from "@prisma/client";
import { Guild, TextChannel } from "discord.js";

const prisma = new PrismaClient();

export async function checkProStatus(guild: Guild) {
  const logsChannel = guild.channels.cache.find(
    (channel) => channel.name === "🤖-bot-logs"
  ) as TextChannel;

  logsChannel.send("Daily verification started.");

  // Fetch all users from the database
  const users = await prisma.userVerification.findMany({
    select: {
      discordId: true,
      mmId: true,
    },
  });

  const moneyIds = users.map((user) => user.mmId);

  // Send a POST request to the provided endpoint with all moneyIds
  let response;
  const SECRET = process.env.API_SECERT;
  if (!SECRET) throw new Error("Missing secret key");

  try {
    response = await fetch(
      "https://moralis-money-support.aws-prod-money-1.moralis.io/support/planFromMoneyIds?supportEmail=john@moralis.io",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": `${process.env.API_SECERT}`,
        },
        body: JSON.stringify({
          moneyIds,
        }),
      }
    );
  } catch (error) {
    console.error("Error fetching plan information:", error);
    return;
  }

  const responseData = await response.json();
  let freeUsersCount = 0;

  // Check each user for a missing 'pro' or 'staff' string or a 'free' string in their plan
  for (const userPlanInfo of responseData) {
    const isFreeUser =
      !userPlanInfo.plan.includes("pro") &&
      !userPlanInfo.plan.includes("staff");

    if (isFreeUser) {
      freeUsersCount++;
      const discordId = users.find(
        (user) => user.mmId === userPlanInfo.moneyId
      )?.discordId;

      if (discordId) {
        // Remove the 'pro' role from the user on Discord
        const proRole = guild.roles.cache.find((role) => role.name === "pro");
        if (proRole) {
          const member = await guild.members.fetch(discordId);
          if (member) {
            await member.roles.remove(proRole);
            logsChannel.send(
              `User <@${discordId}> has been removed from the 'pro' role. \n\`MM Id: ${userPlanInfo.moneyId}\` \n\`Reason: Plan Expired\``
            );

            // Send DM to the user
            member.user
              .send(
                `Your access to Moralis money pro discord server has been removed due to expired plan on your MM Id: ${userPlanInfo.moneyId}. Please email money@moralis.io to help you restore your subscription.`
              )
              .catch(console.error);

            // Remove the user from the database
            await prisma.userVerification.delete({
              where: { discordId },
            });
          }
        }
      }
    }
  }

  if (freeUsersCount === 0) {
    logsChannel.send("No users with a 'free' plan found.");
  }

  logsChannel.send("Daily verification completed.");
}
