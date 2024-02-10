import { SlashCommandBuilder } from "@discordjs/builders";

const resetUser = new SlashCommandBuilder()
  .setName("removeuser")
  .setDescription("Remove pro access of the user.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The Discord user to remove")
      .setRequired(true)
  );

export default resetUser;
