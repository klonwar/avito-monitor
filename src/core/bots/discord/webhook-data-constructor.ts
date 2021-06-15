import {MessageEmbed, MessageEmbedFooter, WebhookMessageOptions} from "discord.js";
import {ItemStatus, StateItem} from "#src/model/task";
import pjson from "../../../../package.json";
import {WEBHOOK_CHANGED_COLOR, WEBHOOK_NEW_COLOR} from "#src/config";

const bold = (str: string): string => `**${str}**`;

const striked = (str: string): string => `~~${str}~~`;

interface FixedMessageEmbedFooter extends MessageEmbedFooter {
  icon_url: string
}

interface FixedMessageEmbed extends Partial<MessageEmbed> {
  footer: FixedMessageEmbedFooter
}

interface FixedWebhookMessageOptions  extends WebhookMessageOptions{
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
    title = ``,
    price = ``,
    photoLink = ``,
    geoReferences = ``,
    link = ``
  } = stateItem.info;

  const space = ` ‏‏‎`;

  const embed: FixedMessageEmbed = {
    title: title.replace(/Объявление/, ``) + ` - ${price}`,
    url: link,
    color: (status === ItemStatus.NEW) ? WEBHOOK_NEW_COLOR : WEBHOOK_CHANGED_COLOR,
    fields: [],
    thumbnail: {
      "url": photoLink
    },
    author: {
      "name": `Avito`,
      "url": `https://www.avito.ru/rossiya/`,
    },
    footer: {
      "text": `Avito Monitor v.${pjson.version} by Klonwar`,
      "icon_url": `https://yt3.ggpht.com/a/AATXAJwG3nq_4r5UAFXdIzmRyK3oA71_klw8QALm00Hz8A=s900-c-k-c0xffffffff-no-rj-mo`
    }
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
    username: `Avito Notification`,
    embeds: [embed],
  };
};

export default webhookDataConstructor;
