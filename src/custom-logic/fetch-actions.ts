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

/*

    const requestParams = new URLSearchParams(`highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E\`+\`&filters=(categoryid%3A1008%20OR%20categoryids%3A1008)%20%20AND%20(parentproductid%3A0%20OR%20isparenteol%3Atrue)%20AND%20(productchannel.1.published%3Atrue)&ruleContexts=%5B%22facet_category_1008%22%5D&distinct=true&maxValuesPerFacet=1000&clickAnalytics=true&query=&hitsPerPage=20&page=0&facets=%5B%22price_ag_floored%22%2C%22isnew%22%2C%22deliverydatepreorder%22%2C%22deliverydatenow%22%2C%22usedproduct%22%2C%22manufacturer%22%2C%22facets.Chipsatz.values%22%2C%22facets.GPUBasistakt.valuesDisplayOrder%22%2C%22facets.GPUBoost-Takt.valuesDisplayOrder%22%2C%22facets.%25c3%259cbertaktet.values%22%2C%22facets.Leistungsstufe.values%22%2C%22facets.Speicher%2528VRAM%2529.valuesDisplayOrder%22%2C%22facets.VRAM-Typ.values%22%2C%22facets.Busbreite.values%22%2C%22facets.Anschluss.values%22%2C%22facets.HDMI.valuesDisplayOrder%22%2C%22facets.miniHDMI.valuesDisplayOrder%22%2C%22facets.DVI.valuesDisplayOrder%22%2C%22facets.VGA.valuesDisplayOrder%22%2C%22facets.DisplayPort.valuesDisplayOrder%22%2C%22facets.miniDisplayPort.valuesDisplayOrder%22%2C%22facets.VirtualLink%2528USBTypC%2529.valuesDisplayOrder%22%2C%22facets.HDCP.values%22%2C%22facets.SLI.values%22%2C%22facets.Crossfire.values%22%2C%22facets.DirectX.values%22%2C%22facets.K%25c3%25bchlungsart.values%22%2C%22facets.K%25c3%25bchlergr%25c3%25b6sse.values%22%2C%22facets.L%25c3%25a4ngederGrafikkarte.valuesDisplayOrder%22%2C%22facets.LowProfile.values%22%2C%22facets.Beleuchtung.values%22%2C%22facets.Stromanschluss.values%22%2C%22facets.NetzteilempfehlungdesHestellers.valuesDisplayOrder%22%5D&tagFilters=&facetFilters=%5B%5B%22facets.Chipsatz.values%3ANVIDIA%C2%AE%20GeForce%C2%AE%22%5D%5D&numericFilters=%5B%22facets.Speicher%2528VRAM%2529.valuesDisplayOrder%3E%3D15%22%5D`);
    requestParams.set(`hitsPerPage`, `100`);

    const res = await (await fetch(process.env.CU_API_LINK, {
      method: `POST`,
      headers: {
        "Referer": `https://www.computeruniverse.net/`,
        "Content-Type": `application/json`
      },
      body: JSON.stringify({
        requests: [{
          indexName: `Prod-ComputerUniverse_ru`,
          params: requestParams.toString()
        }]
      })
    })).json();

    console.log(res.results.map((item) => item.hits.map((item) => item)));

*/