// events/message.ts
import { Embed, Message, PublicThreadChannel } from "discord.js";
import sendToSlack from "../utils/sendToSlack";

export const messageCreateEvent = async (message: Message) => {
  // Check if the message is in the feedback channel
  if ((message.channel as PublicThreadChannel).parent?.name === "🤕-feedback") {
    // Get the message text and author
    const description = `${message.content}`;
    // Extract any images from the message
    const images = message.attachments.map((attachment) => attachment.url);

    // Prepare the embed data
    const embedData = {
      title: "New post in feedback",
      description: description,
      image: images.length > 0 ? images[0] : null, // Only the first image is used
    };

    // Send the message to Slack
    await sendToSlack(message, embedData as Embed, description);
  }
};
