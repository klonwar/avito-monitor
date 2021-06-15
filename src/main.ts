import chalk from "chalk";
import gainLinks from "./core/util/gain-links";
import Task, {StateItem} from "./model/task";
import {waitFor} from "#src/core/util/wait-for";
import sendOnWebhook from "#src/core/bots/discord/send-on-webhook";
import webhookDataConstructor from "#src/core/bots/discord/webhook-data-constructor";
import checkMemory from "#src/core/check-memory";
import pjson from "#src/../package.json";
import readProxyList from "#src/core/proxy/read-proxy-list";
import {IpBanError, TimeoutError} from "#src/core/errors";
import TelegramClient from "#src/core/bots/telegram/telegram-client";
import {EnvError} from "#src/core/errors";
import isRegexException from "#src/core/util/is-regex-exception";

require(`dotenv`).config();


(async () => {
    console.log(`- Avito Monitor v${pjson.version} -`);

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
        exceptRegex = new RegExp(process.env.EXCEPT);
      } catch (e) {
        console.log(chalk.yellow(`-@@ EXCEPT regexp cannot be parsed`));
      }
    }

    // Инициализация ботов
    const isDiscord = process.env.BOT_SOURCE === undefined || process.env.BOT_SOURCE.toUpperCase() === `DISCORD`;

    const isTelegram = !process.env.BOT_SOURCE || process.env.BOT_SOURCE.toUpperCase() === `TELEGRAM`;
    let telegramClient: TelegramClient;

    if (isTelegram) {
      telegramClient = new TelegramClient(process.env.TELEGRAM_TOKEN, {polling: true});
      await telegramClient.init();
    }

    // Отправка информации о конкретном предложении
    const sendMessage = (item: StateItem) => {
      if (!isRegexException(item, exceptRegex)) {
        if (isDiscord) {
          sendOnWebhook(webhookDataConstructor(item));
        } else if (isTelegram) {
          telegramClient.sendAll(item);
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
        await waitFor(parseInt(process.env.DELAY));

        checkMemory(parseInt(process.env.MEMORY_EDGE) || 200);
      } catch (e) {
        if (e.message === `restart`) {
          throw e;
        }

        if (!(e instanceof TimeoutError) && !(e instanceof IpBanError)) {
          console.error(chalk.red(e.trace || e.message));
          console.log(`-@ Waiting for ${process.env.DELAY}ms`);
          await waitFor(parseInt(process.env.DELAY));
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