import { SlashCommandBuilder } from "@discordjs/builders";

const pinMessage = new SlashCommandBuilder()
  .setName("pinmessage")
  .setDescription("Pin a message in a channel.")
  .addStringOption((option) =>
    option
      .setName("message_link")
      .setDescription("The URL of the message to pin")
      .setRequired(true)
  );

export default pinMessage;
