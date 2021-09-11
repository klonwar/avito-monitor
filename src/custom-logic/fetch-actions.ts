import {parse} from "node-html-parser";
import {IpBanError} from "#src/core/errors";
import {ORIGIN} from "#src/config";
import {ItemStatus, StateItem} from "#src/core/interfaces/state-item";

export interface AfterRequestProps {
  response: string;
  result: Array<StateItem>,
  listLink: string
}

export interface AfterRequestActions {
  turnOnDifferentProxy: () => void
}

// You have to parse response and append every item into result

export const afterRequest = async (props: AfterRequestProps, actions: AfterRequestActions): Promise<void> => {
  const {response, result, listLink} = props;
  const {turnOnDifferentProxy} = actions;

  const root = parse(response).querySelector(`div[class*="items-items"]`);
  let elements;

  try {
    elements = root.querySelectorAll(`div[data-marker="item"]`);
  } catch (e) {
    console.error(`--X Ip ban detected`);
    await turnOnDifferentProxy();
    throw new IpBanError();
  }

  elements.map((item) => {
    const stateItem = {
      info: {},
      listLink,
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
};