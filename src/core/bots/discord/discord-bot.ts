import {Bot} from "#src/core/bots/bot";
import {StateItem} from "#src/core/interfaces/state-item";
import sendOnWebhook from "#src/core/bots/discord/util/send-on-webhook";
import webhookDataConstructor from "#src/core/bots/discord/util/webhook-data-constructor";
import {BotStatus} from "#src/core/interfaces/bot-status";

export class DiscordBot implements Bot {
  async sendMessage(item: StateItem): Promise<void> {
    await sendOnWebhook(webhookDataConstructor(item));
  }

  setBotStatus(status: BotStatus[]): void {
    // Not implemented yet
  }
}