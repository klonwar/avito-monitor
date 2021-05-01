import validUrl from "valid-url";
import {readConsole} from "../util/read-console";

const gainLinks = async (): Promise<Array<string>> => {

  if (validUrl.isUri(process.env.LINK))
    return [process.env.LINK];

  const envLinks = process.env.LINKS.split(` `);

  if (envLinks.filter((item) => !validUrl.isUri(item)).length === 0)
    return envLinks;

  return [
    await (async () => {
      let temp = ``;
      while (!validUrl.isUri(temp)) {
        console.log(`-@ Link to monitor`);
        temp = await readConsole();
      }
      return temp;
    })()
  ];

};

export default gainLinks;