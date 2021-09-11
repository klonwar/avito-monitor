import pjson from "#root/package.json";
import {StateItem} from "#src/core/interfaces/state-item";

export const BOT_NAME = `- Avito Monitor v${pjson.version} -`;

export const ORIGIN = `https://avito.ru/`;
export const TIMEOUT = 10000;

export const WEBHOOK_CONFIG = {
  newItemColor: 48340,
  changedColor: 16770304,
  username: `Avito Notification`,
  header: {
    text: `Avito`,
    link: `https://www.avito.ru/rossiya/`
  },
  createTitle: (item: StateItem): string => item.info.title.replace(/Объявление/, ``) + ` - ${item.info.price}`,
  footer: {
    text: `Avito Monitor v.${pjson.version} by Klonwar`,
    icon_url: `https://yt3.ggpht.com/a/AATXAJwG3nq_4r5UAFXdIzmRyK3oA71_klw8QALm00Hz8A=s900-c-k-c0xffffffff-no-rj-mo`
  }
};

export const TELEGRAM_CONFIG = {
  createTitle: (item: StateItem): string => item.info.title.replace(/Объявление/, ``) + ` - ${item.info.price}`,
  helpMessage: `I will notify you about new and changed items on Avito.\n\n` +
    `For more information go to https://github.com/klonwar/avito-monitor`
};