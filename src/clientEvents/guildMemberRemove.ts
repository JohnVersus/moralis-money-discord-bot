import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { removeUser } from "../utils/removeUser";

export const guildMemberRemoveEvent = async (
  member: GuildMember | PartialGuildMember
) => {
  const logsChannel = member.guild.channels.cache.find(
    (channel) => channel.name === "🤖-bot-logs"
  ) as TextChannel;

  console.log(member.id);

  const removedUser = await removeUser(member.user.id);

  if (removedUser) {
    logsChannel.send(
      `User <@${member.user.id}> with \`MM Id: ${removedUser.mmId}\` has left the server and has been removed from the database.`
    );
  } else {
    logsChannel.send(`Non pro user <@${member.user.id}> has left the server.`);
  }
};
