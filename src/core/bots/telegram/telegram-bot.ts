import {Bot} from "#src/core/bots/bot";
import {StateItem} from "#src/core/interfaces/state-item";
import TelegramClient from "#src/core/bots/telegram/util/telegram-client";
import chalk from "chalk";
import Task from "#src/core/task/task";

export class TelegramBot implements Bot {
  private telegramClient = new TelegramClient(process.env.TELEGRAM_TOKEN, {polling: true});
  private initialized = false;

  constructor() {
    this.telegramClient.init().then(() => {
      this.initialized = true;
    });
  }

  async sendMessage(item: StateItem): Promise<void> {
    if (!this.initialized) {
      console.log(chalk.yellow(`-@@ Telegram bot is not initialized`));
      return;
    }
    console.log(item);
    await this.telegramClient.sendAll(item);
  }

  setTask(task: Task): void {
    this.telegramClient.setTask(task);
  }
}