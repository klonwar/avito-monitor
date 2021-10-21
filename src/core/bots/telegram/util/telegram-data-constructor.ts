import { ItemStatus, StateItem } from "#src/core/interfaces/state-item";
import { TELEGRAM_CONFIG } from "#src/config";
import { escapeMarkdown } from "#src/core/bots/telegram/util/escape-markdown";

const bold = (str: string): string => `*${str}*`;

const striked = (str: string): string => `~${str}~`;

interface Message {
  title: string;
  type: string;
  price: string;
  quantity: string;
  date: string;
  links: string;
}

export class MessageBuilder {
  private readonly message: Partial<Message> = {};

  private escape(text: string) {
    return escapeMarkdown(text);
  }

  title(title: string, link: string): MessageBuilder {
    const eTitle = this.escape(title);
    if (!title)
      return this;
    if (!link) {
      this.message.title = eTitle;
    } else {
      this.message.title = `[${eTitle}](${link})`;
    }
    return this;
  }

  type(status: ItemStatus): MessageBuilder {
    if (!status)
      return this;

    const typeTag = this.escape({
      [ItemStatus.NEW]: `#New`,
      [ItemStatus.CHANGED]: `#Changed`,
    }[status]);

    switch (status) {
      case ItemStatus.CHANGED:
        this.message.type = `✏ Type\n${typeTag}`;
        break;
      case ItemStatus.NEW:
        this.message.type = `❗️ Type\n${typeTag}`;
        break;
    }
    return this;
  }

  price(price: string): MessageBuilder {
    if (!price)
      return this;

    if (this.message.price) {
      const splPrice = this.message.price.split(`\n`);
      splPrice.length = 2;
      splPrice[1] = striked(splPrice[1]) + `\n`;

      splPrice.push(bold(this.escape(`${price}`)));

      this.message.price = splPrice.join(`\n`);
    } else {
      this.message.price = `💰 Price\n`;
      this.message.price += this.escape(`${price}`);

    }

    return this;
  }

  oldPrice(price: string): MessageBuilder {
    if (this.message.price) {
      const splPrice = this.message.price.split(`\n`);
      splPrice.length = 2;
      splPrice.push(bold(splPrice[1]));
      splPrice[1] = striked(this.escape(`${price}€`));
      this.message.price = splPrice.join(`\n`);
    } else {
      this.price(price);
    }

    return this;
  }

  static quantityToString(quantity: number): string {
    if (!Number.isFinite(quantity))
      return `1+`;
    else
      return `` + (quantity ?? `?`);
  }

  quantity(quantity: string): MessageBuilder {
    if (!quantity)
      return this;

    if (this.message.quantity) {
      const splQuantity = this.message.quantity.split(`\n`);
      splQuantity.length = 2;
      splQuantity[1] = striked(splQuantity[1]) + `\n`;
      splQuantity.push(bold(this.escape(quantity)));
      this.message.quantity = splQuantity.join(`\n`);

    } else {
      this.message.quantity = `🔢 Quantity\n${this.escape(quantity)}`;
    }
    return this;
  }

  oldQuantity(quantity: string): MessageBuilder {
    if (!quantity)
      return this;

    if (this.message.quantity) {
      const splQuantity = this.message.quantity.split(`\n`);
      splQuantity.length = 2;
      splQuantity.push(bold(splQuantity[1]));
      splQuantity[1] = striked(this.escape(quantity));
      this.message.quantity = splQuantity.join(`\n`);
    } else {
      this.quantity(quantity);
    }

    return this;
  }

  date(date: string): MessageBuilder {
    if (!date)
      return this;

    const eDate = this.escape(date);

    this.message.date = `⏱ Date\n${eDate}`;

    return this;
  }

  links(listLink: string, directLink: string): MessageBuilder {
    this.message.links = `🔗 Links\n[All results](${listLink}) \\| [Direct link](${directLink})`;
    return this;
  }

  build(): string {
    return Object.values(this.message).join(`\n\n`);
  }
}

const telegramDataConstructor = (
  stateItem: StateItem
): string => {
  const {
    status,
    valuesChanged = [],
    listLink
  } = stateItem;
  const {
    price = ``,
    date = ``,
    link = ``,
  } = stateItem.info;


  const messageBuilder = new MessageBuilder()
    .title(TELEGRAM_CONFIG.createTitle(stateItem), link)
    .type(status)
    .price(price)
    .date(date)
    .links(listLink, link);

  const changedPrice = valuesChanged.find((item) => item.key === `price`);

  if (changedPrice)
    messageBuilder
      .oldPrice(changedPrice.previousValue);

  return messageBuilder.build();
};

export default telegramDataConstructor;
