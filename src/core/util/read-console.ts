import * as readline from "readline";

export const readConsole = async (): Promise<string> => {
  const rl = readline.createInterface(process.stdin, process.stdout);
  return new Promise((res) => {
    rl.question(`> `, function (answer) {
      res(answer);
      rl.close();
    });
  });
};