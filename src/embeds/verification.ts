import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

// Create verification embed
export const verificationEmbed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle("Verification")
  .setDescription(
    "To gain access to the rest of the server, please verify yourself:"
  )
  .addFields(
    {
      name: "1. Verification",
      value: "Click on the below button to start the verification.",
    },
    {
      name: "2. Enter Moralis money Id",
      value:
        "You can find your Moralis money Id at https://moralismoney.com/account",
    },
    {
      name: "3. Enjoy the server",
      value: "After verifying, you will have access to all available channels.",
    }
  );

// Create action row with the button
export const verificationButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("start_verification")
    .setLabel("Start Verification")
    .setStyle(ButtonStyle.Success)
);

export const verificationModal = new ModalBuilder()
  .setTitle("Verification")
  .setCustomId("verification_modal")
  .setComponents(
    // @ts-ignore
    new ActionRowBuilder().setComponents(
      new TextInputBuilder()
        .setLabel("Enter your Moralis Money Id")
        .setCustomId("mm_id")
        .setStyle(TextInputStyle.Short)
    )
  );
