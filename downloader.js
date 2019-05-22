const os = require('os');
const path = require('path');
const Config = require('./config').Config;
const puppeteer = require('puppeteer');
const debug = require('./debug');

let config = new Config('downloader', {
  tmpDir: path.join(os.homedir(), '.atoshodl'),
  extensions: [],
  args: []
});

let args = [
  '--no-sandbox',
  '--disable-setuid-sandbox'
];
let extensions = config.get('extensions');
if(typeof extensions == 'object' && extensions instanceof Array) {
  args.push(...extensions.map(path => `--disable-extensions-except=${path}`));
  args.push(...extensions.map(path => `--load-extension=${path}`));
}
let configArgs = config.get('args');
if(typeof configArgs == 'object' && configArgs instanceof Array) {
  args.push(...configArgs);
}
/**@type {puppeteer.Browser} */
let browser;
(async () => {
  browser = await puppeteer.launch({
    args,
    // headless: false
  });
})();

class Downloader {
  /**
   *
   * @param {String} address
   */
  constructor(address) {
    this.address = address;

    this.start = this.start.bind(this);
    this.done = this.done.bind(this);
  }

  /**
   * @param {String} name the name of the file
   * @returns {() => {speed: Number, written: Number, total: Number, estimation: Date, encoding: String, contentType: String, statusCode: Number, statusMessage: String}}
   */
  async start() {
    try {
      let page = await browser.newPage();
      await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: path.isAbsolute(config.get('tmpDir')) ? config.get('tmpDir') : path.join(config.path, config.get('tmpDir'))});
      let response = await page.goto(this.address);
      let request = await response.request();
      let url = await request.url();
      let buffer = await response.buffer();

      setInterval(async () => {
        debug.log('url:', buffer.length, 'headers:', await response.headers());
      });

      await page.close();
    } catch(err) {
      debug.error(err);
    }
  }

  done() {

  }
}

module.exports = Downloader;