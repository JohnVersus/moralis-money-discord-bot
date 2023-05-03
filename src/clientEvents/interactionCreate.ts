import {
  rulesEmbed,
  verificationButton,
  verificationEmbed,
  verificationModal,
} from "../embeds";
import {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  TextChannel,
} from "discord.js";
import { Interaction } from "discord.js";
import { verifyUser } from "../utils/verifyUser";
const rulesChannel = "📚-rules";
const verificationChannel = "✅-verification";
const botLogsChannel = "🤖-bot-logs";

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
              embedType === "verification"
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
    }

    // Handle other slash commands here
  }
  if (interaction.isButton() && interaction.customId === "start_verification") {
    // Create the modal and open it

    interaction.showModal(verificationModal);

    // Acknowledge the button interaction
    // await interaction.deferUpdate();
  }
  if (interaction.isModalSubmit()) {
    // const db: DB = readDb();
    await interaction.deferUpdate();
    if (interaction.customId === "verification_modal") {
      const userInput = interaction.fields.getTextInputValue("mm_id");
      console.log(interaction.fields.getTextInputValue("mm_id"));
      const userId = interaction.user.id;
      // Verify the user and get the result
      try {
        const result = await verifyUser(interaction, userInput);
        // Acknowledge the modal submission and close it
        await interaction.followUp({
          content: "Verification request is processing.",
          ephemeral: true,
        });

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
    }
  }
};
