import { SlashCommandBuilder } from "@discordjs/builders";

const createThreads = new SlashCommandBuilder()
  .setName("createthreads")
  .setDescription("Create multiple threads with a specified suffix.")
  .addIntegerOption((option) =>
    option
      .setName("number")
      .setDescription("The number of threads to create")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("suffix")
      .setDescription("The suffix for the thread names")
      .setRequired(true)
  );

export default createThreads;
