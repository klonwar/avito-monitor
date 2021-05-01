const forever = require(`forever-monitor`);
const path = require(`path`);

const restarts = Number.POSITIVE_INFINITY;

console.log(path.join(__dirname));
const child = new (forever.Monitor)(`./dist/main.js`, {
  max: restarts,
  silent: false,
  args: [`--color`],
  command: `node --expose-gc --max-old-space-size=7000`,
  sourceDir: path.join(__dirname)
});

child.on(`exit`, () => {
  console.log(`restart`);
});

child.start();
