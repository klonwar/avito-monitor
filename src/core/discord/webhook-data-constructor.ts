import {MessageEmbed, WebhookMessageOptions} from "discord.js";
import {ItemStatus, StateItem} from "#src/model/task";

const bold = (str: string): string => `**${str}**`;

const webhookDataConstructor = (
  stateItem: StateItem
): WebhookMessageOptions => {
  const {
    status,
    valuesChanged = []
  } = stateItem;
  const {
    title = ``,
    price = ``,
    photoLink = ``,
    geoReferences = ``,
    link = ``
  } = stateItem.info;

  const space = ` ‏‏‎`;

  const boidIfChanged = (value) => (valuesChanged.includes(value))
    ? bold(stateItem.info[value])
    : stateItem.info[value];

  const embed: MessageEmbed | any = {
    title: title.replace(/Объявление/, ``) + ` - ${price}`,
    url: link,
    color: 48340,
    fields: [],
    thumbnail: {
      "url": photoLink
    },
    author: {
      "name": `Avito`,
      "url": `https://www.avito.ru/rossiya/`,
    },
    footer: {
      "text": `Avito Monitor v.${process.env.VERSION} by Klonwar`,
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
    embed.fields.push({
      name: `Price`,
      value: ` ` + boidIfChanged(`price`) + `\n\n`,
      inline: true
    });
  }

  if (geoReferences) {
    embed.fields.push({
      name: `Geo`,
      value: ` ` + boidIfChanged(`geoReferences`) + `\n\n`,
      inline: true
    });
  }

  embed.fields.push({
    name: `Links`,
    value: `[All results](${process.env.LINK}) | [Direct link](${link})`,
    inline: false
  });

  return {
    username: `Avito Notification`,
    embeds: [embed],
  };
};

export default webhookDataConstructor;
