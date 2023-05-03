import { PrismaClient } from "@prisma/client";
import { Interaction } from "discord.js";
import { config } from "dotenv";
config();

const prisma = new PrismaClient();

export async function verifyUser(interaction: Interaction, secretId: string) {
  // Verify the secret ID by sending a POST request to the provided endpoint
  const SECRET = process.env.API_SECERT;
  if (!SECRET) throw new Error("Missong secert key");
  let response;
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
          moneyIds: [secretId],
        }),
      }
    );
  } catch (error) {
    console.error("Error fetching plan information:", error);
    return {
      success: false,
      message: "Error fetching plan information.",
    };
  }

  const responseData = await response.json();
  const userPlanInfo = responseData[0];
  const isValidSecret = userPlanInfo && userPlanInfo.plan.includes("pro");
  if (!isValidSecret) {
    return {
      success: false,
      message:
        "Invalid secret ID provided or not a pro plan user. Contact moderators if it is a mistake.",
    };
  }

  // Check if the user is already verified
  const existingVerification = await prisma.userVerification.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (existingVerification) {
    return {
      success: false,
      message:
        "User is already verified with with MM Id. Contact Moderators if it is a mistake.",
    };
  }

  // Check if the secret ID is already used
  const usedSecret = await prisma.userVerification.findUnique({
    where: { mmId: secretId },
  });

  if (usedSecret) {
    return {
      success: false,
      message:
        "This MM ID has already been used. Contact Moderators if it is a mistake.",
    };
  }

  // Save the verification in the database
  await prisma.userVerification.create({
    data: {
      discordId: interaction.user.id,
      mmId: secretId,
    },
  });

  // Grant the "pro" role to the user
  const proRole = interaction.guild?.roles.cache.find(
    (role) => role.name === "pro"
  );
  if (proRole) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (member) {
      await member.roles.add(proRole);
    }
  }

  return {
    success: true,
    message: "User successfully verified.",
  };
}
