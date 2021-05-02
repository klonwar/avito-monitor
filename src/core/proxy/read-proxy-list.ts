import readFile from "#src/core/util/read-file";
import path from "path";

const readProxyList = async (filepath: string): Promise<Array<string>> =>
  (await readFile<Array<string>>(path.join(filepath), (str) => str.split(`\n`)))
    .filter((str) => str.length >= 9);

export default readProxyList;
