/* eslint-disable no-unused-vars */
const puppeteer = require('puppeteer');
const Episode = require('../../episode');
const Downloader = require('../../downloader');
const path = require('path');
const url = require('url');
const config = require('./config');

/**
 * @typedef {(page: puppeteer.Page, response: puppeteer.Response) => Promise.<Downloader>} HandlerFunction
 */

class Handler {
  /**
   * creates a new handler
   * @param {Object} properties
   * @param {puppeteer.Browser} properties.browser
   * @param {[String]} properties.hosts
   * @param {HandlerFunction} properties.downloadUrl
   */
  constructor (properties) {
    if(typeof properties != 'object') throw new TypeError('\'properties\' was not an object.');

    /**@type {puppeteer.Browser} */
    this.browser;
    if(typeof properties.browser == 'object') {
      this.browser = properties.browser;
      this.initialized = true;
      this.hasOwnBrowser = false;
    } else this.initialized = false;

    /**@type {[String]} */
    this.hosts = properties.hosts;

    /**@type {HandlerFunction} */
    this.downloadUrl = properties.downloadUrl;

    this.handle = this.handle.bind(this);
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  async init() {
    if(!this.initialized) {
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
      this.browser = await puppeteer.launch({
        args,
        // headless: false
      });
      this.initialized = true;
      this.hasOwnBrowser = true;
    }
  }

  async destroy() {
    if(this.hasOwnBrowser) {
      await this.browser.close();
    }
  }

  /**
   * handles the episodes
   * @param {[Episode]} episodes
   */
  async handle(episodes) {
    let e = episodes.map((episode, index) => ({
      size: episode.size,
      number: index + 1,
      links: episode.links.filter(hl => this.hosts.includes(hl.host)).shift().links,
    }));

    let downloads = await Promise.all(e.map((_e =>
      Promise.all(_e.links.map(link =>
        new Promise(async resolveLink => {
          let page = await this.browser.newPage();
          page.evaluateOnNewDocument(() => {
            // eslint-disable-next-line no-undef
            window.open = () => null;
          });

          try {
            let res = await page.goto(link.href);

            let addr = url.parse(link.href);
            addr.pathname = await this.downloadUrl(page, res);
            let downloadUrl = url.format(addr);
            resolveLink(downloadUrl);
          } catch (err) {
            resolveLink(false);
          }
        })
      ))
    )));

    episodes = episodes.map((episode, i) => {
      episode.downloads = downloads[i];
      return episode;
    });

    await this.serial(...episodes);
  }

  /**
   * handles each episode for its own
   * @param {Episode} episode
   * @param  {...Episode} episodes
   */
  async serial(episode, ...episodes) {
    if(typeof episode == 'object' && episode instanceof Episode
    && typeof episode.downloads == 'object' && episode.downloads instanceof Array) {
      if(episode.downloads.reduce((p, c) => p && typeof c == 'string', true)) {
        let buffers = await Promise.all(episode.downloads.map(download =>
          new Promise(async resolve => {
            try {
              let page = await this.browser.newPage();
              await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: path.isAbsolute(config.get('tmpDir')) ? config.get('tmpDir') : path.join(config.path, config.get('tmpDir'))});
              let response = await page.goto(download);
              resolve(await response.buffer());
            } catch(err) {
              resolve(err);
            }
          })
        ));

        return buffers;
      }
    }
    await this.serial(...episodes);
  }
}

module.exports = {
  Handler
};