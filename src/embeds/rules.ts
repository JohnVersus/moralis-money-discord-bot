// Import necessary modules
import { EmbedBuilder } from "discord.js";

// Create rules embed
export const rulesEmbed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle("📜 Server Rules")
  .setDescription(
    "Welcome to our crypto corner! 🚀 Let's keep our community cool and friendly. Here are some rules to guide us:"
  )
  .addFields(
    {
      name: "1. 🤝 Be Respectful",
      value:
        "Treat others as you'd like to be treated. No harassing, hate speech or discrimination. We're all friends here!",
    },
    {
      name: "2. 🚫 No Spamming",
      value:
        "Nobody likes spam, right? Let's avoid excessive messages, irrelevant content or shameless self-promotion. Keep it clean!",
    },
    {
      name: "3. 🎯 Stay on Topic",
      value:
        "Please stick to the channel's topic. We all love a focused and meaningful discussion about crypto!",
    },
    {
      name: "4. ❌ No NSFW Content",
      value:
        "Keep it clean and family-friendly. No explicit, offensive or inappropriate content, please.",
    },
    {
      name: "5. 💸 No Financial Advice",
      value: "Remember, don't share or ask for financial advice here. DYOR!!",
    },
    {
      name: "6. ⚖️ Follow Discord's ToS",
      value:
        "Last but not least, remember to abide by Discord's ToS. Let's play fair and square!",
    }
  )
  .setTimestamp();
