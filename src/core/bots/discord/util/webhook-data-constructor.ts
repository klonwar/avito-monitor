import {MessageEmbed, MessageEmbedFooter, WebhookMessageOptions} from "discord.js";
import {ItemStatus, StateItem} from "#src/core/interfaces/state-item";
import {WEBHOOK_CONFIG} from "#src/config";

const bold = (str: string): string => `**${str}**`;

const striked = (str: string): string => `~~${str}~~`;

interface FixedMessageEmbedFooter extends MessageEmbedFooter {
  icon_url: string
}

interface FixedMessageEmbed extends Partial<MessageEmbed> {
  footer: FixedMessageEmbedFooter
}

interface FixedWebhookMessageOptions extends WebhookMessageOptions {
  embeds: Array<FixedMessageEmbed>
}

const webhookDataConstructor = (
  stateItem: StateItem
): FixedWebhookMessageOptions => {
  const {
    status,
    valuesChanged = [],
    listLink
  } = stateItem;
  const {
    price = ``,
    photoLink = ``,
    geoReferences = ``,
    link = ``
  } = stateItem.info;

  const space = ` ‏‏‎`;

  const embed: FixedMessageEmbed = {
    title: WEBHOOK_CONFIG.createTitle(stateItem),
    url: link,
    color: (status === ItemStatus.NEW) ? WEBHOOK_CONFIG.newItemColor : WEBHOOK_CONFIG.changedColor,
    fields: [],
    thumbnail: {
      "url": photoLink
    },
    author: {
      "name": WEBHOOK_CONFIG.header.text,
      "url": WEBHOOK_CONFIG.header.link,
    },
    footer: WEBHOOK_CONFIG.footer
  };

  embed.fields.push({
    name: `Type`,
    value: ` ` + ({
      [ItemStatus.NEW]: `New item`,
      [ItemStatus.CHANGED]: `Item changed`,
    }[status]) + `\n\n`,
    inline: false
  });

  if (price) {
    const changedInfo = valuesChanged.find((item) => item.key === `price`);
    if (!changedInfo) {
      embed.fields.push({
        name: `Price`,
        value: ` ` + price + `\n\n`,
        inline: true
      });
    } else {
      embed.fields.push({
        name: `Price`,
        value: ` ${bold(price)} (${striked(changedInfo.previousValue)})\n`,
        inline: true
      });
    }
  }

  if (geoReferences) {
    embed.fields.push({
      name: `Geo`,
      value: ` ` + geoReferences + `\n\n`,
      inline: true
    });
  }

  embed.fields.push({
    name: `Links`,
    value: `[All results](${listLink}) | [Direct link](${link})`,
    inline: false
  });

  return {
    username: WEBHOOK_CONFIG.username,
    embeds: [embed],
  };
};

export default webhookDataConstructor;
