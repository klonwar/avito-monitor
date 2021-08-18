import fetch from "node-fetch";
import {parse} from "node-html-parser";
import {ORIGIN, TIMEOUT} from "#src/config";
import {verifyProxy} from "#src/core/proxy/verify-proxy";
import chalk from "chalk";
import {proxyFetchOptions} from "#src/core/proxy/proxy-fetch-options";
import {IpBanError, TimeoutError} from "#src/core/errors";
import {timeoutPromise} from "#src/core/util/timeout-promise";
import {waitFor} from "#src/core/util/wait-for";

export enum ItemStatus {
  PRISTINE,
  NEW,
  CHANGED
}

export enum BotStatus {
  NOT_INITIALIZED = `Not initialized`,
  INITIALIZING = `Initializing`,
  INITIALIZED = `Initialized`,
  UPDATING = `Updating`,
  UPDATED = `Updated`,
  WAITING = `Waiting`,
  PROXY_SEARCH = `Looking for a valid proxy`,
}

export interface StateItem {
  id: number;
  status: ItemStatus;
  valuesChanged: Array<{
    key: string
    previousValue: string;
  }>;
  listLink: string
  info: {
    title: string;
    price: string;
    date: string;
    link: string;
    photoLink: string;
    geoReferences: string;
  }
}

type SubscribeFunction = (item: StateItem, index: number) => void;

interface Props {
  links: Array<string>;
  proxy?: Array<string>;
  subscribe?: {
    onNew?: SubscribeFunction;
    onChanged?: SubscribeFunction;
  };
}


class Task {
  public botStatus: BotStatus[] = [BotStatus.NOT_INITIALIZED];
  private readonly links: Array<string>;
  private readonly proxy: {
    list: Array<string>
    active: string
  };
  private state: Array<StateItem>;
  initialized = false;
  private seenIds = new Set();

  private readonly onNew: SubscribeFunction;
  private readonly onChanged: SubscribeFunction;

  lastIterationTime: number;
  isModified = false;

  constructor(props: Props) {
    this.links = props.links;
    this.proxy = {
      list: props.proxy,
      active: null
    };
    this.onNew = props.subscribe?.onNew || (() => {
    });
    this.onChanged = props.subscribe?.onChanged || (() => {
    });
  }

  private pushBotStatus(...status: BotStatus[]): void {
    this.botStatus.push(...status);
  }

  private setBotStatus(...status: BotStatus[]): void {
    this.botStatus.length = 0;
    this.pushBotStatus(...status);
  }

  private removeBotStatus(...status: BotStatus[]): void {
    const newStatus = this.botStatus.filter((item) => !status.includes(item));
    this.setBotStatus(...newStatus);
  }

  fillSeenIds(): void {
    this.state.map((item) => {
      this.seenIds.add(item.id);
    });
  }

  private async inner_init(): Promise<void> {
    if (!this.proxy.active)
      await this.turnOnDifferentProxy();
    this.state = await this.requestUrls();
    this.fillSeenIds();

    this.initialized = true;
  }

  async init(): Promise<void> {
    this.setBotStatus(BotStatus.INITIALIZING);
    while (!this.initialized) {
      try {
        await this.inner_init();
      } catch (e) {
        if (!(e instanceof TimeoutError)) {
          console.error(e.stack);
        }
      }
    }
    this.setBotStatus(BotStatus.INITIALIZED);
  }

  async update(): Promise<void> {
    if (!this.initialized)
      throw new Error(`Task is not initialized`);

    this.setBotStatus(BotStatus.UPDATING);

    let isAppearedFromAbove = true;
    const startTime = Date.now();

    const newState = await this.requestUrls();

    this.isModified = false;
    newState.map((newItem, newItemIndex) => {
        const oldIndex = this.state.findIndex((oldItem) => oldItem.id === newItem.id);
        const oldItem = (oldIndex === -1) ? null : this.state[oldIndex];

        if (oldItem) {
          isAppearedFromAbove = false;

          newItem.valuesChanged = Object.keys(newItem.info)
            .filter((key) => [`price`].includes(key))
            .filter((key) => newItem.info[key] !== oldItem.info[key])
            .map((key) => ({
              key,
              previousValue: oldItem.info[key]
            }));

          if (newItem.valuesChanged.length !== 0) {
            if (newItem.status === ItemStatus.PRISTINE) {
              newItem.status = ItemStatus.CHANGED;
              this.isModified = true;
              this.onChanged(newItem, newItemIndex);
            }
          } else {
            newItem.status = ItemStatus.PRISTINE;
          }
        } else {
          if (isAppearedFromAbove && !this.seenIds.has(newItem.id)) {
            newItem.status = ItemStatus.NEW;
            this.isModified = true;
            this.onNew(newItem, newItemIndex);
          } else {
            newItem.status = ItemStatus.PRISTINE;
          }
        }
      }
    );

    this.state = newState;
    this.fillSeenIds();
    this.lastIterationTime = Date.now() - startTime;
    this.setBotStatus(BotStatus.UPDATED);
  }

  async wait(): Promise<void> {
    this.setBotStatus(BotStatus.WAITING);
    await waitFor(parseInt(process.env.DELAY));
    this.removeBotStatus(BotStatus.WAITING);
  }

  private async requestUrls(): Promise<Array<StateItem>> {
    const result: Array<StateItem> = [];

    for (const link of this.links) {
      console.log(chalk.blue(`--> Request to ${link}`));

      const timeoutPromiseResponse = (await timeoutPromise(async () => {
        const response = await fetch(link, proxyFetchOptions(
          this.proxy.active,
          ORIGIN
        ));
        return await response.text();
      }, TIMEOUT));

      if (!timeoutPromiseResponse.res) {
        console.error(chalk.red(timeoutPromiseResponse.comment));
        await this.turnOnDifferentProxy();
        throw new TimeoutError();
      }

      const response = timeoutPromiseResponse.res;

      const root = parse(response).querySelector(`div[class*="items-items"]`);
      let elements;

      try {
        elements = root.querySelectorAll(`div[data-marker="item"]`);
      } catch (e) {
        console.error(`--X Ip ban detected`);
        await this.turnOnDifferentProxy();
        throw new IpBanError();
      }

      elements.map((item) => {
        const stateItem = {
          info: {},
          listLink: link,
        } as StateItem;

        stateItem.id = parseInt(item.getAttribute(`data-item-id`));

        const linkElement = item.querySelector(`a[title]`);
        stateItem.info.title = linkElement.getAttribute(`title`);
        stateItem.info.link = ORIGIN + linkElement.getAttribute(`href`);

        const imageElement = linkElement.querySelector(`img[class*="photo-slider-image"]`);
        stateItem.info.photoLink = imageElement?.getAttribute(`src`) || ``;

        const priceElement = item.querySelector(`span[class*="price-text"]`);
        stateItem.info.price = priceElement.innerText;

        const dateElement = item.querySelector(`div[data-marker="item-date"]`);
        stateItem.info.date = dateElement?.innerText || ``;

        stateItem.info.geoReferences = item.querySelector(`div[class*="geo-root"]`)?.innerText?.trim() || ``;

        stateItem.status = ItemStatus.PRISTINE;
        stateItem.valuesChanged = [];
        result.push(stateItem);
      });
    }

    return result;
  }

  async turnOnDifferentProxy(): Promise<void> {
    console.log(`-@ Looking for a valid proxy`);
    let time = new Date().getTime();

    if (!this.proxy.list)
      return;

    this.pushBotStatus(BotStatus.PROXY_SEARCH);
    const startIndex = (
      this.proxy.list.findIndex(
        (item) => item === this.proxy.active
      ) + 1
    ) % this.proxy.list.length;

    for (let i = startIndex; this.proxy.list.length !== 0; i = (i + 1) % this.proxy.list.length) {
      const item = this.proxy.list[i];
      if (item.length < 9) {
        continue;
      }

      const response = await verifyProxy(`${item}`, `https://www.avito.ru/voronezh`, 10000);

      if (response.valid) {
        console.log(chalk.green(`--V [${response.comment}] ${item}`));
        this.proxy.active = item;
        break;
      }

      console.log(chalk.red(`--X [${response.comment}] ${item}`));

    }

    time = new Date().getTime() - time;
    if (Math.floor(time * 100) > 1) {
      console.log(`-@@ [${chalk.magenta(`PROXY`)}] ${(time / 1000).toFixed(3)}s`);
    }
    this.removeBotStatus(BotStatus.PROXY_SEARCH);
  }
}

export default Task;