import { config } from "dotenv";
config();
import { Client, GatewayIntentBits, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import postEmbed from "./commands/postEmbed";
import resetUser from "./commands/resetUser";
import { interationEvent } from "./clientEvents/interactionCreate";
import { checkProStatus } from "./utils/checkProStatus";
import { guildMemberRemoveEvent } from "./clientEvents/guildMemberRemove";
import { messageCreateEvent } from "./clientEvents/messageCreate";
import { threadUpdateEvent } from "./clientEvents/threadUpdate";
import createThreads from "./commands/createthreads";
import { postDataToDiscord } from "./utils/BackupToDiscord";

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});
if (!TOKEN) {
  throw new Error("Missing TOKEN env variables ");
}
const rest = new REST({ version: "10" }).setToken(TOKEN);
const wait = require("node:timers/promises").setTimeout;

client.on("interactionCreate", interationEvent);

client.on("guildMemberRemove", guildMemberRemoveEvent);

client.on("messageCreate", messageCreateEvent);

client.on("threadUpdate", threadUpdateEvent);

setInterval(() => {
  client.guilds.cache.forEach(async (guild) => {
    await checkProStatus(guild);
    await postDataToDiscord(client);
  });
}, 60 * 1000 * 60 * 24);

async function main() {
  // remove test commands after launce
  const commands = [postEmbed, resetUser, createThreads];
  try {
    console.log("Started refreshing application (/) commands.");
    if (!CLIENT_ID || !GUILD_ID) {
      throw new Error("Missing CLIENT_ID or GUILD_ID under env variables ");
    }
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    client.login(TOKEN);
  } catch (err) {
    console.log(err);
  }
}

// client.on("ready", () => {
//   CLIENT_ID = client.application.id;

//   console.log(`${client.user.tag} has logged in!`);

//   // const Guilds = client.guilds.cache.map((guild) => guild.id);
//   // console.log(Guilds);
// });
main();
