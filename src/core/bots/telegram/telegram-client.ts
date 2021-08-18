import TelegramBot from "node-telegram-bot-api";
import chalk from "chalk";
import writeFile from "#src/core/util/write-file";
import readFile from "#src/core/util/read-file";
import telegramDataConstructor from "#src/core/bots/telegram/telegram-data-constructor";
import {BotStatus, StateItem} from "#src/model/task";
import os from "os";

class TelegramClient extends TelegramBot {
  private readonly chatIdsFile = `db/chat-ids.db`;
  private chatIds: Array<number> = [];
  botStatus: BotStatus[] = null;

  constructor(token: string, options?: TelegramBot.ConstructorOptions) {
    super(token, options);

    this.setMyCommands([
      {command: `/start`, description: `Start receiving notifications`},
      {command: `/help`, description: `Show help`},
      {command: `/memory `, description: `Show used RAM`},
      {command: `/ping `, description: `Check bot availability`},
      {command: `/status `, description: `Show bot status`},
    ]);


    this.onText(/\/start/, async (msg) => {
      if (!this.chatIds.includes(msg.chat.id)) {
        console.log(`-@@ [${chalk.greenBright(`BOT`)}] +${msg.chat.id}`);
        this.chatIds.push(msg.chat.id);
        await this.saveIds();
      }
    });

    this.onText(/\/help/, async (msg) => {
      await this.sendMessage(
        msg.chat.id,
        `I will notify you about new and changed items on Avito.\n\n` +
        `For more information go to https://github.com/klonwar/avito-monitor`,
      );
    });

    this.onText(/\/memory/, async (msg) => {
      const div = (8 * 2 ** 10 * 2 ** 10);
      const total = Math.floor(os.totalmem() / div) / 1024;
      const avail = Math.floor(os.freemem() / div) / 1024;
      const used = total - avail;

      await this.sendMessage(
        msg.chat.id,
        `${used.toFixed(3)} / ${total.toFixed(3)} GB (${(~~(used / total * 10000) / 100).toFixed(2)}%)`
      );
    });

    this.onText(/\/ping/, async (msg) => {
      await this.sendMessage(
        msg.chat.id,
        `Alive`
      );
    });

    this.onText(/\/status/, async (msg) => {
      if (!this.botStatus)
        await this.sendMessage(
          msg.chat.id,
          `Not ready yet`
        );
      else
        await this.sendMessage(
          msg.chat.id,
          this.botStatus.map((item) => `_${item}_`).join(` / `),
          {parse_mode: `MarkdownV2`}
        );
    });
  }

  async init(): Promise<void> {
    try {
      this.chatIds = await readFile<Array<number>>(this.chatIdsFile,
        (str) => str
          .split(`\n`)
          .filter((item) => item.length > 0)
          .map((item) => parseInt(item))
      );
    } catch (e) {
      if (e.message.includes(`ENOENT`)) {
        await this.saveIds();
      } else {
        throw e;
      }
    }
  }

  setBotStatus(botStatus: BotStatus[]): void {
    this.botStatus = botStatus;
  }

  private async saveIds(): Promise<void> {
    await writeFile(this.chatIdsFile, this.chatIds.join(`\n`));
  }

  async sendAll(item: StateItem): Promise<void> {
    let time = new Date().getTime();
    await Promise.allSettled(this.chatIds.map((chatId) => (async () => {
      try {
        await this.sendMessage(chatId, telegramDataConstructor(item), {
          parse_mode: `MarkdownV2`
        });
      } catch (e) {
        console.error(e.stack);
      }
    })()));
    time = new Date().getTime() - time;
    console.log(`-@@ [${chalk.red(`TELEGRAM`)}] ${(time / 1000).toFixed(3)}s`);
  }
}

export default TelegramClient;