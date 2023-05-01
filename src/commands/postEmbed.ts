// postEmbed.ts
import { SlashCommandBuilder } from "@discordjs/builders";

const postEmbed = new SlashCommandBuilder()
  .setName("postembed")
  .setDescription("Post rules or verification message embed.")
  .addStringOption((option) =>
    option
      .setName("embed")
      .setDescription("Choose the embed to post")
      .setRequired(true)
      .addChoices(
        { name: "Rules", value: "rules" },
        { name: "Verification", value: "verification" }
      )
  );

export default postEmbed;
