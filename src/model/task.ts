import fetch from "node-fetch";
import {parse} from "node-html-parser";
import {ORIGIN} from "#src/config";

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
  link: string;
  subscribe?: {
    onNew?: SubscribeFunction;
    onChanged?: SubscribeFunction;
  };
}


class Task {
  private link: string;
  private state: Array<StateItem>;
  private initialized = false;
  private seenIds = new Set();

  private readonly onNew: SubscribeFunction;
  private readonly onChanged: SubscribeFunction;

  lastIterationTime: number;
  isModified = false;

  constructor(props: Props) {
    this.link = props.link;
    this.onNew = props.subscribe?.onNew || (() => {
    });
    this.onChanged = props.subscribe?.onChanged || (() => {
    });
  }

  fillSeenIds() {
    this.state.map((item) => {
      this.seenIds.add(item.id);
    });
  }

  async init(): Promise<void> {
    this.initialized = true;
    this.state = await this.requestUrl();
    this.fillSeenIds();
  }

  async update(): Promise<void> {
    if (!this.initialized)
      throw new Error(`Task is not initialized`);

    let isAppearedFromAbove = true;
    const startTime = Date.now();
    const newState: Array<StateItem> = await this.requestUrl();

    this.isModified = false;
    newState.map((newItem, newItemIndex) => {
        const oldIndex = this.state.findIndex((oldItem) => oldItem.id === newItem.id);
        const oldItem = (oldIndex === -1) ? null : this.state[oldIndex];

        if (oldItem) {
          isAppearedFromAbove = false;
          newItem.valuesChanged = Object.keys(newItem.info)
            .filter((key) => ![`photoLink`, `date`].includes(key))
            .filter((key) => newItem[key] !== oldItem[key]);
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

    const response = await (await fetch(this.link)).text();

    const root = parse(response).querySelector(`div[class*="items-items"]`);
    let elements;

    try {
      elements = root.querySelectorAll(`div[data-marker="item"]`);
    } catch (e) {
      console.error(`Your ip is banned`);
      throw e;
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

      stateItem.info.geoReferences = item.querySelector(`div[class*="geo-root"]`)?.innerText || ``;

      stateItem.status = ItemStatus.PRISTINE;
      stateItem.valuesChanged = [];
      result.push(stateItem);
    });

    return result;
  }

}

export default Task;