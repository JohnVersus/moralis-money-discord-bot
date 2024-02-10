import {
  rulesEmbed,
  verificationButton,
  verificationEmbed,
  verificationModal,
} from "../embeds";
import {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  CacheType,
  TextChannel,
  codeBlock,
} from "discord.js";
import { Interaction } from "discord.js";
import { verifyUser } from "../utils/verifyUser";
import { reviewStartButton, reviewStartEmbed } from "../embeds/reviewEmbed";
import {
  toolRatingSelect,
  detailedReviewModal,
  endReviewButton,
  endReviewWithLinkButton,
  moreReviewButton,
  supportRatingSelect,
  trustpilotEmbed,
} from "../embeds/reviewQuestions";
import { prisma } from "../db/db";
import { client } from "..";

const rulesChannel = "📚-rules";
const verificationChannel = "✅-verification";
const botLogsChannel = "🤖-bot-logs";
const reviewChannel = "📝-user-review";

export const interationEvent = async (interaction: Interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === "postembed") {
      // Get the embed option value
      const embedOption = interaction.options.get("embed");
      const embedType = embedOption?.value as string;

      // Define the embed to send and the target channel
      let embedToSend;
      let embedButton;
      let targetChannel = "";

      if (embedType === "rules") {
        embedToSend = rulesEmbed;
        targetChannel = rulesChannel;
      } else if (embedType === "verification") {
        embedToSend = verificationEmbed;
        embedButton = verificationButton;
        targetChannel = verificationChannel;
      } else if (embedType === "review") {
        embedToSend = reviewStartEmbed;
        embedButton = reviewStartButton;
        targetChannel = reviewChannel;
      }

      const botchannel = interaction.guild?.channels.cache.find(
        (ch) => ch.name === botLogsChannel
      );

      // Send the selected embed to the target channel
      if (embedToSend && targetChannel) {
        const channel = interaction.guild?.channels.cache.find(
          (ch) => ch.name === targetChannel
        );

        if (
          channel instanceof TextChannel &&
          botchannel instanceof TextChannel
        ) {
          await channel.send({
            embeds: [embedToSend],
            components:
              embedType === "verification" || embedType === "review"
                ? [
                    embedButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
                  ]
                : [],
          });
          await interaction.reply({
            content: `Embed posted in ${targetChannel} channel.`,
            ephemeral: true,
          });
          await botchannel.send({
            content: `Embed posted in ${targetChannel} channel.`,
          });
        } else {
          await interaction.reply({
            content: `Unable to find the ${targetChannel} channel.`,
            ephemeral: true,
          });
        }
      } else {
        await interaction.reply({
          content: "Invalid embed type provided.",
          ephemeral: true,
        });
      }
    } else if (interaction.commandName === "removeuser") {
      const user = interaction.options.getUser("user", true);
      const botchannel = interaction.guild?.channels.cache.find(
        (ch) => ch.name === botLogsChannel
      );
      if (!(botchannel instanceof TextChannel)) {
        await interaction.reply({
          content: "Error occured at channel for porcessing the removal.",
          ephemeral: true,
        });
        return;
      }
      try {
        // Find the mmId from the database using the Discord ID
        const userVerification = await prisma.userVerification.findUnique({
          where: { discordId: user.id },
        });

        if (userVerification) {
          // Remove the "pro" role from the user
          const proRole = interaction.guild?.roles.cache.find(
            (role) => role.name === "pro"
          );
          const member = await interaction.guild?.members.fetch(user.id);

          if (proRole && member?.roles.cache.has(proRole.id)) {
            await member.roles.remove(proRole);
            await botchannel.send(
              `Pro access of <@${user.id}> has been removed.`
            );
          }

          // Delete the user's record from the database
          await prisma.userVerification.delete({
            where: { discordId: user.id },
          });
          await botchannel.send(
            `${userVerification.mmId} has been removed from the database.`
          );
        } else {
          await botchannel.send(
            `No verification found for user <@${user.id}>.`
          );
        }
      } catch (error) {
        console.error("Error resetting user:", error);
        await botchannel.send(
          `Error resetting user <@${user.id}>: ${(error as Error).message}`
        );
      }
    }

    // Handle other slash commands here
  }
  if (interaction.isButton()) {
    if (interaction.customId === "start_verification") {
      // Create the modal and open it

      interaction.showModal(verificationModal);

      // Acknowledge the button interaction
      // await interaction.deferUpdate();
    } else if (interaction.customId === "start_review") {
      const lastReview = await prisma.review.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (lastReview?.lastReviewed) {
        const diffInMilliseconds =
          Date.now() - lastReview.lastReviewed.getTime();
        const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
        if (diffInDays < 30) {
          await interaction.reply({
            content: `You have already reviewed the Moralis Money Product this month. Please wait for ${Math.ceil(
              30 - diffInDays
            )} days for submitting another review.`,
            ephemeral: true,
          });
        } else {
          return;
        }
      } else {
        await interaction.reply({
          content: "How would you rate the Moralis Money Product?",
          ephemeral: true,
          components: [
            toolRatingSelect as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
      }
    } else if (interaction.customId === "add_details") {
      await interaction.showModal(detailedReviewModal);
    } else if (interaction.customId === "skip_details") {
      const discordId = interaction.user.id;
      const review = await prisma.review.findUnique({ where: { discordId } });

      // If the user rated 5 stars in both categories, send the trustpilot review request
      if (review?.firstRating === 5 && review?.secondRating === 5) {
        await interaction.update({
          embeds: [trustpilotEmbed],
          components: [
            endReviewWithLinkButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
      } else {
        await interaction.update({
          content: "Thank you for your review!",
          components: [
            endReviewButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
      }
    } else if (interaction.customId === "end_review") {
      const discordId = interaction.user.id;
      const review = await prisma.review.findUnique({ where: { discordId } });

      // Thank the user for their review
      await interaction.update({
        content: "Thank you for your review, it's been successfully submitted!",
        embeds: [],
        components: [],
      });

      // Post the user's review data in the 📝-user-reviews channel
      const reviewChannel = client.channels.cache.find(
        (channel) => (channel as TextChannel).name === "📝-user-reviews"
      ) as TextChannel;
      if (reviewChannel) {
        reviewChannel.send(
          `<@${interaction.user.id}> has submitted a new review:\n` +
            codeBlock(
              "json",
              JSON.stringify(
                {
                  "Product Rating": review?.firstRating,
                  "Support Rating": review?.secondRating,
                  "Detailed Review": review?.detailedReview,
                },
                null,
                2
              )
            )
        );
      }
    } else {
      await interaction.reply({
        content: "Unknown interaction. Please try again",
        embeds: [],
        components: [],
      });
    }
  }
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "tool_rating") {
      const discordId = interaction.user.id;
      const apiRating = interaction.values[0];
      try {
        interaction.update({
          content: "How would you rate our customer support?",
          components: [
            supportRatingSelect as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
        await prisma.review.upsert({
          where: { discordId },
          update: { firstRating: Number(apiRating) },
          create: { discordId, firstRating: Number(apiRating) },
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          content: "Interaction failed. Please try again.",
          ephemeral: true,
        });
      }
    } else if (interaction.customId === "support_rating") {
      const discordId = interaction.user.id;
      const serviceRating = interaction.values[0];

      interaction.update({
        content: "Would you like to add more detailed review?",
        components: [
          moreReviewButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
      await prisma.review.update({
        where: { discordId },
        data: { secondRating: Number(serviceRating) },
      });
    }

    // Handle other interactions
  }
  if (interaction.isModalSubmit()) {
    // const db: DB = readDb();
    if (interaction.customId === "verification_modal") {
      await interaction.deferUpdate();
      const userInput = interaction.fields.getTextInputValue("mm_id");
      console.log(interaction.fields.getTextInputValue("mm_id"));
      const userId = interaction.user.id;
      // Verify the user and get the result
      try {
        // Acknowledge the modal submission and close it
        await interaction.followUp({
          content: "Verification request is processing.",
          ephemeral: true,
        });
        const result = await verifyUser(interaction, userInput);

        // Post the verification status in the bot logs channel
        const botLogsChannel = interaction.guild?.channels.cache.find(
          (ch) => ch.name === "🤖-bot-logs"
        ) as TextChannel;

        if (botLogsChannel) {
          await botLogsChannel.send(
            `${result.message} (User ID: <@${interaction.user.id}>) \n\`MM Id: ${userInput}\``
          );
        }

        await interaction.followUp({
          content: result.message,
          ephemeral: true,
        });
      } catch (error) {
        console.log(error);
        await interaction.followUp({
          content: "Verification failed. Contact moderator.",
          ephemeral: true,
        });
      }
    } else if (interaction.customId === "detailed_review_modal") {
      const discordId = interaction.user.id;
      const detailedReview = interaction.fields.getTextInputValue(
        "detailed_review_input"
      ); // Fetching the detailed review from the modal
      await interaction.deferUpdate();

      // Updating the database with the detailed review
      const review = await prisma.review.update({
        where: { discordId },
        data: { detailedReview, lastReviewed: new Date() },
      });

      // Check if both ratings are 5
      if (review.firstRating === 5 && review.secondRating === 5) {
        // Send the trustpilot review request
        await interaction.editReply({
          embeds: [trustpilotEmbed],
          components: [
            endReviewWithLinkButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
      } else {
        // Thank the user for their review
        await interaction.editReply({
          content: "Thank you for your detailed review!",
          components: [
            endReviewButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
      }
    }
  }
};
