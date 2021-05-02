import fs from "fs";
import path from "path";
import appRoot from "app-root-path";

const readFile = async <T = any>(
  pathname: string,
  handler: (t: string) => T
    = (str) => (str as unknown) as T
): Promise<ReturnType<typeof handler>> => {
  const dirPathname = path.dirname(pathname);

  if (!fs.existsSync(dirPathname)) {
    fs.mkdir(dirPathname, {recursive: true}, (err) => {
      console.error(err);
    });
  }

  const opened = await fs.openSync(path.join(appRoot + ``, pathname), `r`);
  const str = await fs.readFileSync(path.join(appRoot + ``, pathname), {encoding: `utf8`});
  const res = await handler(str);

  fs.closeSync(opened);

  return res || undefined;
};

export default readFile;
