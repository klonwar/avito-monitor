import readProxyList from "#src/core/proxy/read-proxy-list";
import chalk from "chalk";
import Task from "#src/core/task/task";
import isRegexException from "#src/core/util/is-regex-exception";
import checkMemory from "#src/core/util/check-memory";
import {EnvError, IpBanError, TimeoutError} from "#src/core/errors";
import {StateItem} from "#src/core/interfaces/state-item";
import gainLinks from "#src/core/util/gain-links";
import {BOT_NAME} from "#src/config";
import {Bot} from "#src/core/bots/bot";
import {TelegramBot} from "#src/core/bots/telegram/telegram-bot";
import {DiscordBot} from "#src/core/bots/discord/discord-bot";

require(`dotenv`).config();

(async () => {
    console.log(BOT_NAME);

    // Найдем ссылки
    let links;
    try {
      links = await gainLinks();
    } catch (e) {
      throw new EnvError(`Links cannot be parsed. Check .env file`);
    }

    console.log();

    // Поиск прокси
    let proxy: Array<string> = null;
    try {
      proxy = await readProxyList(process.env.PROXY);
    } catch (e) {
      console.log(chalk.yellow(`-@@ No proxy list loaded`));
    }

    // Регулярное выражение для исключения результатов
    let exceptRegex: RegExp = null;
    if (process.env.EXCEPT) {
      try {
        exceptRegex = new RegExp(process.env.EXCEPT, `i`);
      } catch (e) {
        console.log(chalk.yellow(`-@@ EXCEPT regexp cannot be parsed`));
      }
    }

    // Инициализация ботов
    const isDiscord = process.env.BOT_SOURCE === undefined || process.env.BOT_SOURCE.toUpperCase() === `DISCORD`;
    const isTelegram = !process.env.BOT_SOURCE || process.env.BOT_SOURCE.toUpperCase() === `TELEGRAM`;

    let bot: Bot;
    if (isTelegram) {
      bot = new TelegramBot();
    } else if (isDiscord) {
      bot = new DiscordBot();
    } else {
      console.log(chalk.yellow(`-@@ No bot source selected`));
    }

    // Отправка информации о конкретном предложении
    const sendMessage = (item: StateItem) => {
      if (!isRegexException(item, exceptRegex)) {
        if (bot) {
          bot.sendMessage(item);
        } else {
          console.log(chalk.yellow(`-@@ No bot source selected, can't send message`));
        }
      }
    };

    // Действия при изменениях в списке товаров
    const onNew = (item: StateItem) => {
      if (process.env.MESSAGE_ON_NEW !== `false`) {
        sendMessage(item);
      }
    };

    const onChanged = (item: StateItem) => {
      if (process.env.MESSAGE_ON_CHANGE !== `false`) {
        sendMessage(item);
      }
    };

    const task = new Task({
      links,
      proxy,
      subscribe: {
        onNew,
        onChanged,
      }
    });

    bot.setBotStatus(task.botStatus);

    // Нам необходимо инициализировать бота
    console.log(chalk.bgBlueBright.black(`-@ Initializing...`));
    await task.init();

    // Бесконечный цикл сравнения состояния
    for (; ;) {
      try {
        console.log();
        console.log(chalk.bgMagentaBright.black(`-@ Updating...`));
        await task.update();

        console.log(`-@ Fetched in ${(task.lastIterationTime / 1000).toFixed(3)}s`);
        console.log(`-@ Waiting for ${process.env.DELAY}ms`);
        await task.wait();

        checkMemory(parseInt(process.env.MEMORY_EDGE) || 200);
      } catch (e) {
        if (e.message === `restart`) {
          throw e;
        }

        if (!(e instanceof TimeoutError) && !(e instanceof IpBanError)) {
          console.error(chalk.red(e.trace || e.message));
          console.log(`-@ Waiting for ${process.env.DELAY}ms`);
          await task.wait();
        }
      }
    }
  }
)().catch((err) => {
  if (err.message === `restart`) {
    process.exit(2);
  }

  console.error(`\n` + err.stack);

  process.exit(1);
});