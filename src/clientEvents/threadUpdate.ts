import { AnyThreadChannel } from "discord.js";
import handleThreadClose from "../utils/handleThreadClose";

export const threadUpdateEvent = async (
  oldThread: AnyThreadChannel<boolean>,
  newThread: AnyThreadChannel<boolean>
) => {
  if (newThread.archived) {
    console.log("thread closed");
    handleThreadClose(newThread);
  }
};
