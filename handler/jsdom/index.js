/* eslint no-unused-vars: off */
const http = require('http');
const https = require('https');
const url = require('url');
const JSDOM = require('jsdom').JSDOM;
const Episode = require('../../episode');
const Downloader = require('../../downloader');
const debug = require('../../debug');
const jquery = require('jquery');

/**
 * @typedef {Object} WebPage
 * @property {String} address the source of this page
 * @property {Object} headers headers
 * @property {String} content html content
 * @property {Object} status
 * @property {Number} status.code
 * @property {String} status.message
 */

class Handler {
  /**
   * creates a new handler
   * @param {Object} props
   * @param {[String]} props.hosts
   * @param {String} targetDir
   */
  constructor (props) {
    if(typeof props != 'object') throw new TypeError('\'props\' was not an object.');

    if(typeof props.hosts == 'object' && props.hosts instanceof Array) {
      this.hosts = props.hosts;
    }

    if(typeof props.targetDir == 'string') {
      this.targetDir = props.targetDir;
    }

    this.execute = this.execute.bind(this);
    this.document = this.document.bind(this);
    this.load = this.load.bind(this);
    this.hostedLinkCollection = this.hostedLinkCollection.bind(this);
  }

  /**
   * get the links relevant for this handler
   * @param {Episode} episode
   */
  hostedLinkCollection(episode) {
    return episode.links.filter(link => this.hosts.includes(link.host));
  }

  /**
   * execute this handler on an episode
   * meant to be overwritten by subclasses
   * @param {Episode} episode
   * @param {(doc: HTMLDocument, resolve: (result: {success: Boolean, download: Downloader)} fn
   */
  async execute (episode, fn) {
    // get hosted links
    let hlc = this.hostedLinkCollection(episode);
    if(hlc.length >= 1) {
      return await Promise.all(hlc.shift().links.map(l =>
        new Promise(resolve => {
          this.document(l).then(doc => {
            fn.call(this, doc, resolve);
          });
        })));
    } else return undefined;
  }

  /**
   * @param {Episode.Link} link
   * @returns {Promise.<HTMLDocument>}
   */
  async document(link) {
    // let page = await this.load(link.href);
    let jsdom = await JSDOM.fromURL(link.href, {
      runScripts: 'dangerously',
      resources: 'usable',
    });
    jsdom.window.$ = jquery;
    return jsdom.window.document;
  }

  /**
   * loads a web page
   * @param {String} addr the address to load from
   * @returns {Promise.<WebPage>}
   */
  async load(addr) {
    let a = url.parse(addr);

    let h = http;
    if(a.protocol == 'https:') {
      h = https;
    }

    /** @type {WebPage} */
    let result = {};

    return await new Promise(resolve => {
      new h.ClientRequest(url.format(a), res => {
        let body = '';

        result.address = url.format(a);

        result.status = {
          code: res.statusCode,
          message: res.statusMessage
        };

        result.headers = res.headers;

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('close', () => {
          result.content = body;
          resolve(result);
        });
      });
    });
  }
}

module.exports = {
  Handler
};