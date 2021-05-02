import {readConsole} from "./core/util/read-console";
import chalk from "chalk";
import gainLinks from "./core/gain-links";
import Task from "./model/task";
import {waitFor} from "#src/core/util/wait-for";
import sendOnWebhook from "#src/core/discord/send-on-webhook";
import webhookDataConstructor from "#src/core/discord/webhook-data-constructor";
import checkMemory from "#src/core/check-memory";
import pjson from "#src/../package.json";
import readProxyList from "#src/core/proxy/read-proxy-list";
import IpBanError from "#src/core/errors";

require(`dotenv`).config();

(async () => {
  console.log(`- Avito Monitor v${pjson.version} -`);

  // Найдем ссылки
  let links;
  try {
    links = await gainLinks();
  } catch (e) {
    throw new Error(`Check .env file`);
  }
  links.map((item) => console.log(`-@@ ${chalk.blue(item)}`));

  // Поиск прокси

  let proxy;
  try {
    proxy = await readProxyList(process.env.PROXY);
  } catch (e) {
    console.log(chalk.yellow(`-@@ No proxy list loaded`));
  }


  const task = new Task({
    links,
    proxy,
    subscribe: {
      onNew: (item) => {
        sendOnWebhook(webhookDataConstructor(item));
      },
      onChanged: (item) => {
        sendOnWebhook(webhookDataConstructor(item));
      },
    }
  });

  console.log(`-@ Initializing`);
  await task.init();

  // Бесконечный цикл сравнения состояния
  for (; ;) {
    try {
      console.log(`-@ Updating...`);
      await task.update();
      console.log(`-@ Fetched in ${(task.lastIterationTime / 1000).toFixed(3)}s`);
      console.log(`-@ Waiting for ${process.env.DELAY}ms`);
      await waitFor(parseInt(process.env.DELAY));

      checkMemory(parseInt(process.env.MEMORY_EDGE) || 200);
    } catch (e) {
      if (e.message === `restart`) {
        throw e;
      }

      console.error(chalk.red(e.trace || e.message));
      console.log(`-@ Waiting for ${process.env.DELAY}ms`);
      await waitFor(parseInt(process.env.DELAY));

    }
  }

  /*
  console.log(`-@ Type anything to exit: `);
  await readConsole();
  process.exit(0);
  */
})().catch((err) => {
  if (err.message === `restart`) {
    process.exit(1);
  }

  console.error(chalk.red(err.stack));
  console.log(`-@ Type anything to exit: `);
  readConsole().then(() => process.exit(1)).catch(() => process.exit(1));
});