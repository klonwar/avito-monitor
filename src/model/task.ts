import fetch from "node-fetch";
import {parse} from "node-html-parser";
import {ORIGIN} from "#src/config";
import {verifyProxy} from "#src/core/proxy/verify-proxy";
import chalk from "chalk";
import {proxyFetchOptions} from "#src/core/proxy/proxy-fetch-options";
import IpBanError from "#src/core/errors";

export enum ItemStatus {
  PRISTINE,
  NEW,
  CHANGED
}

export interface StateItem {
  id: number;
  status: ItemStatus;
  valuesChanged: Array<string>;
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
  private readonly links: Array<string>;
  private readonly proxy: {
    list: Array<string>
    active: string
  };
  private state: Array<StateItem>;
  private initialized = false;
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

  fillSeenIds(): void {
    this.state.map((item) => {
      this.seenIds.add(item.id);
    });
  }

  async init(): Promise<void> {
    await this.turnOnDifferentProxy();
    this.state = await this.requestUrl();
    this.fillSeenIds();

    this.initialized = true;
  }

  async update(): Promise<void> {
    if (!this.initialized)
      throw new Error(`Task is not initialized`);

    let isAppearedFromAbove = true;
    const startTime = Date.now();
    let newState: Array<StateItem>;

    try {
      newState = await this.requestUrl();
    } catch (e) {
      return await this.update();
    }
    this.isModified = false;
    newState.map((newItem, newItemIndex) => {
        const oldIndex = this.state.findIndex((oldItem) => oldItem.id === newItem.id);
        const oldItem = (oldIndex === -1) ? null : this.state[oldIndex];

        if (oldItem) {
          isAppearedFromAbove = false;
          newItem.valuesChanged = Object.keys(newItem.info)
            .filter((key) => ![`photoLink`, `date`, `geoReferences`].includes(key))
            .filter((key) => newItem.info[key] !== oldItem.info[key]);
          if (newItem.valuesChanged.length !== 0) {
            newItem.status = ItemStatus.CHANGED;
            this.isModified = true;
            this.onChanged(newItem, newItemIndex);
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
  }

  private async requestUrl(): Promise<Array<StateItem>> {
    const result: Array<StateItem> = [];

    for (const link of this.links) {
      const response = await (await fetch(link, proxyFetchOptions(
        this.proxy.active,
        ORIGIN
      ))).text();

      const root = parse(response).querySelector(`div[class*="items-items"]`);
      let elements;

      try {
        elements = root.querySelectorAll(`div[data-marker="item"]`);
      } catch (e) {
        console.error(chalk.red(e.message));
        await this.turnOnDifferentProxy();
        throw new IpBanError();
      }

      elements.map((item) => {
        const stateItem = {
          info: {}
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
    let time = new Date().getTime();

    if (!this.proxy.list)
      return;

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
        console.log(chalk.green(`-V [${response.comment}] ${item}`));
        this.proxy.active = item;
        break;
      }

      console.log(chalk.red(`-X [${response.comment}] ${item}`));

    }

    time = new Date().getTime() - time;
    if (Math.floor(time * 100) > 1) {
      console.log(`-@ [${chalk.magenta(`PROXY`)}] ${(time / 1000).toFixed(3)}s`);
    }
  }
}

export default Task;