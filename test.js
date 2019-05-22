const puppeteer = require('puppeteer');
const config = require('./handler/puppeteer/config');

let args = [];
let extensions = config.get('extensions');
if(typeof extensions == 'object' && extensions instanceof Array) {
  args.push(...extensions.map(path => `--disable-extensions-except=${path}`));
  args.push(...extensions.map(path => `--load-extension=${path}`));
}
let configArgs = config.get('args');
if(typeof configArgs == 'object' && configArgs instanceof Array) {
  args.push(...configArgs);
}

(async () => {
  let browser = await puppeteer.launch({
    headless: false,
    args
  });
})();