import TelegramBot from "node-telegram-bot-api";
import chalk from "chalk";
import writeFile from "#src/core/util/write-file";
import readFile from "#src/core/util/read-file";
import telegramDataConstructor from "#src/core/bots/telegram/util/telegram-data-constructor";
import os from "os";
import moment from "moment";
import { StateItem } from "#src/core/interfaces/state-item";
import { TELEGRAM_CONFIG } from "#src/config";
import Task from "#src/core/task/task";
import { escapeMarkdown } from "#src/core/bots/telegram/util/escape-markdown";

class TelegramClient extends TelegramBot {
  private readonly chatIdsFile = `db/chat-ids.db`;
  private chatIds: Array<number> = [];
  private task: Task = null;

  constructor(token: string, options?: TelegramBot.ConstructorOptions) {
    super(token, options);

    this.setMyCommands([
      {command: `/status `, description: `Show bot status`},
      {command: `/list `, description: `Show items. \`/list all\` for all items`},
      {command: `/available `, description: `Show available items. \`/available all\` for all available items`},
      {command: `/ping `, description: `Check bot availability`},
      {command: `/help`, description: `Show help`},
      {command: `/memory `, description: `Show used RAM`},
      {command: `/start`, description: `Start receiving notifications`},
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
        TELEGRAM_CONFIG.helpMessage,
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
      if (!this.task.botStatus)
        await this.sendMessage(
          msg.chat.id,
          `Not ready yet`
        );
      else {
        const lastDate = this.task.botStatus[this.task.botStatus.length - 1].start;

        const deltas = {
          d: moment().diff(lastDate, `days`),
          h: moment().diff(lastDate, `hours`),
          m: moment().diff(lastDate, `minutes`),
          s: moment().diff(lastDate, `seconds`),
          ms: moment().diff(lastDate, `milliseconds`),
        };
        const timeLabel = Object.entries(deltas).find(([, value]) => {
          if (value) {
            return true;
          }
        }).reverse().join(``);

        await this.sendMessage(
          msg.chat.id,
          this.task.botStatus.map((item) => `_${item.status}_`).join(` / `) + ` \\- ${timeLabel}`,
          {parse_mode: `MarkdownV2`}
        );
      }
    });

    this.onText(/\/(list|available)/, async (msg) => {
      if (!this.task.state) {
        await this.sendMessage(
          msg.chat.id,
          `No list yet`
        );
        return;
      }

      const filteredState: StateItem[] = this.task.state;

      const rows = filteredState.map(
        (item, index) => `${index + 1}\\. [${escapeMarkdown(item.info.title)}](${item.info.link})\n` +
          `${escapeMarkdown(item.info.price)} \n`
      );

      let answer = ``;
      let index = -1;
      for (const item of rows) {
        index++;

        // Не можем отправить так много символов
        if (answer.length + item.length > 3500) {
          const hiddenResultsCount = rows.length - index;
          answer += `\n`;

          if (hiddenResultsCount !== 0)
            answer += `\\.\\.\\. and ${hiddenResultsCount} more`;
          break;
        } else {
          answer += `\n${item}`;
        }
      }
      answer += `\n🔗 Links\n`;
      answer += `[All items](${this.task.state[0]?.listLink})`;

      await this.sendMessage(
        msg.chat.id,
        answer,
        {parse_mode: `MarkdownV2`, disable_web_page_preview: true}
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

      console.log(`Bot users:`);
      for (const chatId of this.chatIds) {
        try {
          const chat = await this.getChat(chatId);
          if (!chat.username)
            console.log(chalk.blue(`no username - ${chatId}`));
          else
            console.log(chalk.blue(`@${chat.username}`));
        } catch (e) {
          console.log(`removed - ${chatId}`);
        }
      }
    } catch (e) {
      if (e.message.includes(`ENOENT`)) {
        await this.saveIds();
      } else {
        throw e;
      }
    }
  }

  setTask(task: Task): void {
    this.task = task;
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