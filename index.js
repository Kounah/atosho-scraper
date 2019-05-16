const readline = require('readline');
const process = require('process');
const JSDOM = require('jsdom');
const url = require('url');
const http = require('http');
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Plugin = require('./plugin');
const Episode = require('./episode');

let _log = console.log;
console.log = function(...params) {
  if(Boolean(process.env['atosho_debug'])) {
    _log(...params);
  }
}

let rl = readline.createInterface(process.stdin, process.stdout);

/** @type {Plugin} */
let plugin
if(process.env["atosho_plugin"]) {
  plugin = require(path.join(process.cwd(), process.env["atosho_plugin"]))();
  console.log('loaded plugin');
}

async function q(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function start() {
  let address;
  if(process.env['atosho_addr']) {
    address = url.parse(process.env['atosho_addr']);
  } else {
    let addressValid = false;
    do {
      try {
        address = url.parse(await q('Enter Url: '));
        if(address.hostname != 'animetosho.org') throw new Error('invalid host');
        if(!['http:', 'https:'].includes(address.protocol)) throw new Error('invalid protocol');
        addressValid = true;
      } catch(err) {
        console.error(err);
        addressValid = false;
      }
    } while(!addressValid);
  }

  let jsdom = new JSDOM.JSDOM(await get(address));
  let d = jsdom.window.document;

  /** @type {Episode} */
  let filesIndex = Array.prototype.slice.call(d.querySelectorAll('#content > table > tbody > tr > th'))
    .map((elem, index) => (elem.textContent || elem.innerText) == 'Files' ? index : undefined)
    .filter(i => i != undefined)
    .shift();
  let episodes = Array.prototype.slice.call(d.querySelectorAll(`#content > table > tbody > tr:nth-child(${filesIndex + 1}) > td > div > div`))
  .map(episodeElement => new Episode(episodeElement));

  process.stdout.write(JSON.stringify(episodes, null, '\t'));
  process.exit(1);
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
    console.log(`GET ${a} STARTED`);

    let h = http;
    if(addr.protocol == 'https:') {
      h = https;
    }

    // let req =
    h.get(a, res => {
      let body = "";

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('close', () => {
        if([200].includes(res.statusCode)) {
          console.log(`GET ${a} DONE`);
          resolve(body);
        } else {
          throw new Error(`${a} answered with unexpected status code: ${res.statusCode} ${res.statusMessage}`);
        }
      })
    });
  });
}

start().then(result => {
  console.log(result);
}).catch(err => {
  console.error(err);
})