import {ItemStatus, StateItem} from "#src/model/task";

const escapeMarkdown = (str: string): string => str.replace(/([[\]()`>#+\-=|{}*_~\\.!])/g, `\\$1`);

const bold = (str: string): string => `**${str}**`;

const striked = (str: string): string => `~${str}~`;

const telegramDataConstructor = (
  stateItem: StateItem
): string => {
  const {
    status,
    valuesChanged = [],
    listLink
  } = stateItem;
  const {
    title = ``,
    price = ``,
    geoReferences = ``,
    link = ``
  } = stateItem.info;

  const typeTag = ({
    [ItemStatus.NEW]: `New`,
    [ItemStatus.CHANGED]: `Changed`,
  }[status]);


  let text = ``;

  text += `[${
    escapeMarkdown(title.replace(/Объявление/, ``) + ` - ${price}`)
  }](${
    link
  })` + `\n`;
  text += `\n`;

  text += `${
    (status === ItemStatus.NEW)
      ? `❗️`
      : `✏`
  } ${bold(`Type`)}` + `\n`;
  text += escapeMarkdown(`#${typeTag}`) + `\n`;
  text += `\n`;

  if (price) {
    text += `💰 ${bold(`Price`)}` + `\n`;

    const changedInfo = valuesChanged.find((item) => item.key === `price`);
    if (!changedInfo) {
      text += price + `\n`;
    } else {
      text += `${bold(price)} (${striked(changedInfo.previousValue)})` + `\n`;
    }

    text += `\n`;
  }

  if (geoReferences) {
    text += `📍 ${bold(`Geo`)}` + `\n`;
    text += escapeMarkdown(geoReferences) + `\n`;

    text += `\n`;
  }
  text += `🔗 ${bold(`Links`)}` + `\n`;
  text += `[All results](${listLink}) \\| [Direct link](${link})` + `\n`;

  return text;
};

export default telegramDataConstructor;
