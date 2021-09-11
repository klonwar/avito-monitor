import Discord, {WebhookMessageOptions} from "discord.js";
import chalk from "chalk";

const sendOnWebhook = async (data: WebhookMessageOptions): Promise<void> => {
  const webhookClient = new Discord.WebhookClient(
    process.env.WEBHOOK_ID,
    process.env.WEBHOOK_TOKEN,
  );

  if (webhookClient) {
    let time = new Date().getTime();

    await webhookClient.send(data);

    time = new Date().getTime() - time;
    console.log(`-@@ [${chalk.red(`WEBHOOK`)}] ${(time / 1000).toFixed(3)}s`);
  }
};

export default sendOnWebhook;
