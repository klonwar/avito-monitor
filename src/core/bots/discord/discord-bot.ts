import { Bot } from "#src/core/bots/bot";
import { StateItem } from "#src/core/interfaces/state-item";
import sendOnWebhook from "#src/core/bots/discord/util/send-on-webhook";
import webhookDataConstructor from "#src/core/bots/discord/util/webhook-data-constructor";
import Task from "#src/core/task/task";

export class DiscordBot implements Bot {
  async sendMessage(item: StateItem): Promise<void> {
    await sendOnWebhook(webhookDataConstructor(item));
  }

  setTask(task: Task): void {
    // Not implemented yet
  }


}