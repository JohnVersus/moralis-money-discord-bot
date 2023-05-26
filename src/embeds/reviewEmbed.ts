import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

// Create the review start embed
export const reviewStartEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setAuthor({
    name: "Moralis Money Review",
    iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
    url: "https://moralismoney.com/",
  })
  .setThumbnail("https://avatars.githubusercontent.com/u/80474746?s=200&v=4")
  .setDescription(
    "Let us know your thoughts on Moralis Money product and the customer support provided by the team. \n\nClick on the below Start button to start the review process!! \nThank You for your time."
  );

// Create action row with the start review button
export const reviewStartButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("start_review")
    .setLabel("Start Review")
    .setStyle(ButtonStyle.Success)
);
