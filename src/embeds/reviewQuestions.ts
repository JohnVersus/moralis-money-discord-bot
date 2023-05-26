import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const toolRatingSelect = new ActionRowBuilder().setComponents(
  new StringSelectMenuBuilder().setCustomId("tool_rating").setOptions([
    { label: "⭐️", value: "1" },
    { label: "⭐️⭐️", value: "2" },
    { label: "⭐️⭐️⭐️", value: "3" },
    { label: "⭐️⭐️⭐️⭐️", value: "4" },
    { label: "⭐️⭐️⭐️⭐️⭐️", value: "5" },
  ])
);

export const supportRatingSelect = new ActionRowBuilder().setComponents(
  new StringSelectMenuBuilder().setCustomId("support_rating").setOptions([
    { label: "⭐️", value: "1" },
    { label: "⭐️⭐️", value: "2" },
    { label: "⭐️⭐️⭐️", value: "3" },
    { label: "⭐️⭐️⭐️⭐️", value: "4" },
    { label: "⭐️⭐️⭐️⭐️⭐️", value: "5" },
  ])
);

export const moreReviewButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("add_details")
    .setLabel("Add more details")
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId("skip_details")
    .setLabel("Skip ⏭️")
    .setStyle(ButtonStyle.Secondary)
);

export const detailedReviewModal = new ModalBuilder()
  .setTitle("Detailed Review")
  .setCustomId("detailed_review_modal")
  .setComponents(
    // @ts-ignore
    new ActionRowBuilder().setComponents(
      new TextInputBuilder()
        .setLabel("Do you want to add a detailed review?")
        .setCustomId("detailed_review_input")
        .setStyle(TextInputStyle.Paragraph)
    )
  );

export const trustpilotEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setAuthor({
    name: "Trustpilot Review Request",
    iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
    url: "https://moralismoney.com/",
  })
  .setThumbnail(
    "https://cdn.trustpilot.net/brand-assets/1.5.0/favicons/apple-touch-icon.png"
  )
  .setDescription(
    "Thank You for rating us with 5 Star🤩. \n Could you please leave a review on our Trustpilot about the Moralis Money. \nIt will mean a lot for us to spread the positive word. \n\nYou can find our Trustpilot here - https://www.trustpilot.com/review/moralismoney.com \n\nThank you for your time"
  );

export const endReviewButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("end_review")
    .setLabel("Mark as done!!")
    .setStyle(ButtonStyle.Success)
);

export const endReviewWithLinkButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("end_review")
    .setLabel("Mark as done!!")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setLabel("Visit")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.trustpilot.com/review/moralismoney.com")
);
