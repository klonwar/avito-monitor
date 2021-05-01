import validUrl from "valid-url";
import {readConsole} from "../util/read-console";

const gainLink = async (): Promise<string> => {
  let link: string;

  if (!validUrl.isUri(process.env.LINK)) {
    link = await (async () => {
      let temp = ``;
      while (!validUrl.isUri(temp)) {
        console.log(`-@ Link to monitor`);
        temp = await readConsole();
      }
      return temp;
    })();
  } else {
    link = process.env.LINK;
  }

  return link;
};

export default gainLink;