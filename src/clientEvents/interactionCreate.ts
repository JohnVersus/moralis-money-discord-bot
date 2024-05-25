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
  Channel,
  ChannelType,
  GuildMember,
  GuildMemberRoleManager,
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
      await interaction.deferReply({ ephemeral: true });
      const user = interaction.options.getUser("user", true);
      const botchannel = interaction.guild?.channels.cache.find(
        (ch) => ch.name === botLogsChannel
      );
      if (!(botchannel instanceof TextChannel)) {
        await interaction.reply({
          content: "Error occurred at channel for processing the removal.",
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
          // Remove the "pro" role from the user if they are in the guild
          const proRole = interaction.guild?.roles.cache.find(
            (role) => role.name === "pro"
          );

          try {
            const member = await interaction.guild?.members.fetch(user.id);
            if (proRole && member?.roles.cache.has(proRole.id)) {
              await member.roles.remove(proRole);
              await botchannel.send(
                `Pro access of <@${user.id}> has been removed.`
              );
            }
          } catch (fetchError) {
            await botchannel.send(
              `<@${user.id}> is not found in the server or did not have a pro role.`
            );
          }

          // Delete the user's record from the database regardless of their guild membership status
          await prisma.userVerification.delete({
            where: { discordId: user.id },
          });
          await botchannel.send(
            `\`${userVerification.mmId}\` has been removed from the database.`
          );
        } else {
          await botchannel.send(
            `MM Id of user <@${user.id}> is not found in the database.`
          );
        }
      } catch (error) {
        console.error("Error resetting user:", error);
        await botchannel.send(
          `Error removing the pro access of user <@${user.id}>: ${
            (error as Error).message
          }`
        );
      }
      await interaction.editReply({
        content: "Process is complete. Check the logs for more details.",
      });
    } else if (interaction.commandName === "createthreads") {
      // Correctly extract options from the command
      await interaction.deferReply({ ephemeral: true });
      const numberOfThreads = interaction.options.get("number");
      const suffix = interaction.options.get("suffix");

      if (!suffix || !numberOfThreads) {
        await interaction.reply({
          content: `Theread suffix and count are mising`,
          ephemeral: true,
        });
        return;
      }

      console.log(numberOfThreads.value, suffix.value);
      const channelName = "🎫-open-a-ticket";

      // Find the channel by name
      const channel = interaction.guild?.channels.cache.find(
        (c) => c.name === channelName && (c as Channel).isTextBased()
      );

      if (!channel || !(channel instanceof TextChannel)) {
        await interaction.reply({
          content: `Channel "${channelName}" not found or doesn't support threads.`,
          ephemeral: true,
        });
        return;
      }

      // Retrieve the current count from the database
      let threadCount;
      try {
        threadCount = await prisma.threadCount.findFirst({
          where: { suffix: suffix.value as string },
        });

        if (!threadCount) {
          // If no record found, initialize it
          threadCount = await prisma.threadCount.create({
            data: { suffix: suffix.value as string, count: 0 },
          });
        }
      } catch (error) {
        console.error(`Error retrieving thread count: ${error}`);
        await interaction.editReply({
          content: `Error retrieving thread count.`,
        });
        return;
      }

      // Loop and create threads starting from the current count + 1
      let currentCount = threadCount.count;
      for (let i = 1; i <= (numberOfThreads?.value as unknown as number); i++) {
        try {
          const thread = await channel.threads.create({
            name: `ticket-${currentCount + i} - ${suffix?.value}`,
            autoArchiveDuration: 10080, // Set to 7 days
            reason: `Ticket Thread ${currentCount + i}`,
            type: ChannelType.PrivateThread,
          });

          // Delete the system message about the thread creation
          // const systemMessage = await thread.fetchStarterMessage();
          // if (systemMessage) {
          //   await systemMessage.delete();
          // }

          // Post and delete the message to add mod users
          const message = await thread.send({
            content:
              "<@859421814177923105> <@208898272637485057> <@894658368789168149> <@1088269918564270131> <@940209372531937291> <@769173957366120518> <@419162461585932290>", // Replace with actual user IDs
          });
          await message.delete();

          console.log(`Created thread: ${thread.name}`);
        } catch (error) {
          console.error(`Error creating thread: ${error}`);
          await interaction.editReply({
            content: `Error creating threads.`,
          });
          return;
        }
      }

      // Update the thread count in the database
      try {
        await prisma.threadCount.updateMany({
          where: { suffix: suffix.value as string },
          data: {
            count: currentCount + (numberOfThreads.value as number),
          },
        });
      } catch (error) {
        console.error(`Error updating thread count: ${error}`);
        await interaction.editReply({
          content: `Error updating thread count.`,
        });
        return;
      }

      // Confirm thread creation to the user who initiated the command
      await interaction.editReply({
        content: `Created ${numberOfThreads?.value} threads with suffix "${suffix?.value}".`,
      });
    } else if (interaction.commandName === "pinmessage") {
      await interaction.deferReply({ ephemeral: true });

      // Get the message URL from the command options
      const messageUrlOption = interaction.options.get("message_link", true);
      const messageUrl = messageUrlOption.value as string;
      const urlParts = messageUrl.split("/").slice(-2);
      const channelID = urlParts[0];
      const messageID = urlParts[1];

      // Check if the user has the 📌 role
      const member = interaction.member as GuildMember;
      if (!member.roles.cache.some((role) => role.name === "📌")) {
        await interaction.editReply({
          content: "You do not have permission to pin messages.",
        });
        return;
      }

      try {
        const textChannel = (await interaction.guild?.channels.fetch(
          channelID
        )) as TextChannel;
        const message = await textChannel.messages.fetch(messageID);
        await message.pin();
        await interaction.editReply({
          content: "Message pinned successfully!",
        });

        // Log the event in the bot logs channel
        const botchannel = interaction.guild?.channels.cache.find(
          (ch) => ch.name === botLogsChannel
        );
        if (botchannel) {
          await (botchannel as TextChannel).send(
            `<@${member.user.id}> pinned a message: ${messageUrl}`
          );
        }
      } catch (error) {
        await interaction.editReply({
          content: `An error occurred: ${error}`,
        });
      }
    } else if (interaction.commandName === "unpinmessage") {
      await interaction.deferReply({ ephemeral: true });

      // Get the message URL from the command options
      const messageUrlOption = interaction.options.get("message_link", true);
      const messageUrl = messageUrlOption.value as string;
      const urlParts = messageUrl.split("/").slice(-2);
      const channelID = urlParts[0];
      const messageID = urlParts[1];

      // Check if the user has the 📌 role
      const member = interaction.member as GuildMember;
      if (!member.roles.cache.some((role) => role.name === "📌")) {
        await interaction.editReply({
          content: "You do not have permission to unpin messages.",
        });
        return;
      }

      try {
        const textChannel = (await interaction.guild?.channels.fetch(
          channelID
        )) as TextChannel;
        const message = await textChannel.messages.fetch(messageID);
        await message.unpin();
        await interaction.editReply({
          content: "Message unpinned successfully!",
        });

        // Log the event in the bot logs channel
        const botchannel = interaction.guild?.channels.cache.find(
          (ch) => ch.name === botLogsChannel
        );
        if (botchannel) {
          await (botchannel as TextChannel).send(
            `<@${member.user.id}> unpinned a message: ${messageUrl}`
          );
        }
      } catch (error) {
        await interaction.editReply({
          content: `An error occurred: ${error}`,
        });
      }
    }

    // Handle other slash commands here
  }
  if (interaction.isButton()) {
    if (interaction.customId === "start_verification") {
      // Fetch the member from the interaction
      const member = interaction.member;

      // Check if the member has the "pro" role by name
      // Adjust 'pro' to match the exact case and spelling of the role name in your server
      const hasProRole = (member?.roles as GuildMemberRoleManager).cache.some(
        (role) => role.name === "pro"
      );

      if (hasProRole) {
        // User has the "pro" role, send an ephemeral message to let them know they are already verified
        await interaction.reply({
          content: "You are already verified!",
          ephemeral: true,
        });
      } else {
        // User does not have the "pro" role, proceed with verification
        interaction.showModal(verificationModal);

        // Acknowledge the button interaction if necessary
        // await interaction.deferUpdate();
      }
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
