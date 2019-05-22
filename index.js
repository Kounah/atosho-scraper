const args = require('./args');

const readline = require('readline');
const process = require('process');
const JSDOM = require('jsdom');
const url = require('url');
const http = require('http');
const https = require('https');
const path = require('path');

const config = require('./config').default;
const debug = require('./debug');

const Plugin = require('./plugin');
const Episode = require('./episode');
// const JsdomHandler = require('./handler/jsdom').Handler;
const PuppeteerHandler = require('./handler/puppeteer').Handler;

debug.log(args);

let rl = readline.createInterface(process.stdin, process.stdout);

async function q(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

/**
 * starts the scraper
 * @param {Object} props properties to start this with, if its not an object it will collect the information from env vars
 * @param {String} props.address
 * @param {Array.<{name: String, path: String, class: Function, plugin: Plugin}>} props.plugins
 * @param {[PuppeteerHandler]} props.handlers
 */
async function start(props) {
  if(typeof props !== 'object') {
    props = {
      address: process.env['atosho_address'],
      plugins: Object.keys(process.env)
        .filter(key => key.startsWith('atosho_plugin'))
        .map(key => {
          let p = path.isAbsolute(process.env[key])
            ? process.env[key]
            : path.join(process.cwd(), process.env[key]);
          return {
            name: key,
            path: p,
            /**@type {Function} */
            class: require(p),
            plugin: undefined
          };
        })
        .filter(_ => typeof _.class == 'function' && _.class.prototype instanceof Plugin)
        .map(_ => {
          _.plugin = new _.class(config.pluginSettings);
          return _;
        }),
      handlers: Object.keys(process.env)
        .filter(key => key.startsWith('atosho_handler'))
        .map(key => {
          let p = path.isAbsolute(process.env[key])
            ? process.env[key]
            : path.join(process.cwd(), process.env[key]);
          return require(p);
        })
        .filter(_ => typeof _ == 'object' && _ instanceof PuppeteerHandler)
    };
  }

  let address;
  if(props.address) {
    address = url.parse(props.address);
  } else {
    let addressValid = false;
    do {
      try {
        address = url.parse(await q('Enter Url: '));
        if(address.hostname != 'animetosho.org') throw new Error('invalid host');
        if(!['http:', 'https:'].includes(address.protocol)) throw new Error('invalid protocol');
        addressValid = true;
      } catch(err) {
        debug.error(err);
        addressValid = false;
      }
    } while(!addressValid);
  }

  debug.log('loading anime-tosho site');
  let jsdom = await JSDOM.JSDOM.fromURL(url.format(address)); // (await get(address));
  let d = jsdom.window.document;

  debug.log('retrieving information');
  let seriesIndex = Array.prototype.slice.call(d.querySelectorAll('#content > table > tbody > tr > th'))
    .map((elem, index) => (elem.textContent || elem.innerText).startsWith('Series') ? index : undefined)
    .filter(i => i != undefined)
    .shift();
  let series =  seriesIndex ? d.querySelector(`#content > table > tbody > tr:nth-child(${seriesIndex + 1}) > td > a`).textContent : '';
  debug.log('- series:', series);

  /**@type {Episode} */
  let filesIndex = Array.prototype.slice.call(d.querySelectorAll('#content > table > tbody > tr > th'))
    .map((elem, index) => (elem.textContent || elem.innerText) == 'Files' ? index : undefined)
    .filter(i => i != undefined)
    .shift();

  /**@type {Array.<Episode>} */
  let episodes = Array.prototype.slice.call(d.querySelectorAll(`#content > table > tbody > tr:nth-child(${filesIndex + 1}) > td > div > div`))
    .map(episodeElement => new Episode(episodeElement));
  debug.log('- episodes:', episodes);

  debug.log('initializing handlers');
  await Promise.all(props.handlers.map(handler => handler.init()));
  // handled episode download collection
  debug.log('getting downloads');
  await Promise.all(props.handlers.map(handler => handler.handle(episodes)));

}

/**
 * gets stuff, yay
 * @param {url.UrlWithStringQuery} addr
 */
async function get(addr) {
  if(typeof addr == 'string') return get(url.parse(addr));

  return new Promise(resolve => {
    let a = url.format(addr, {
      slashes: true
    });

    let h = http;
    if(addr.protocol == 'https:') {
      h = https;
    }

    // let req =
    h.get(a, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('close', () => {
        if([200].includes(res.statusCode)) {
          resolve(body);
        } else {
          throw new Error(`${a} answered with unexpected status code: ${res.statusCode} ${res.statusMessage}`);
        }
      });
    });
  });
}

start().then(result => {
  debug.log(result);
}).catch(err => {
  debug.error(err);
});