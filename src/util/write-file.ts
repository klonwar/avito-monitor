import fs from "fs";
import path from "path";
import appRoot from "app-root-path";

const writeFile = async (
  pathname: string,
  content: string
): Promise<boolean> => {
  const dirPathname = path.dirname(pathname);

  if (!fs.existsSync(dirPathname)) {
    fs.mkdir(dirPathname, {recursive: true}, (err) => {
      console.error(err);
    });
  }

  const opened = fs.createWriteStream(path.join(``+appRoot, pathname), {flags: `w`});

  opened.write(content);

  opened.close();

  return true;
};

export default writeFile;
