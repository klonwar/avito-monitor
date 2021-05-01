import chalk from "chalk";

const checkMemory = (edge: number): void => {
  if (global.gc) {
    global.gc();
    const nowMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100;
    console.log(`-@@ [${chalk.blue(`MEMORY`)}] ${nowMem} MB`);

    if (nowMem >= edge) {
      throw new Error(`restart`);
    }
  }
};

export default checkMemory;