import { SlashCommandBuilder } from "@discordjs/builders";

const unpinMessage = new SlashCommandBuilder()
  .setName("unpinmessage")
  .setDescription("Unpin a message from a channel.")
  .addStringOption((option) =>
    option
      .setName("message_link")
      .setDescription("The URL of the message to unpin")
      .setRequired(true)
  );

export default unpinMessage;
