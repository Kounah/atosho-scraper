const jsdom = require('jsdom');
const url = require('url');

/**
 * @typedef {Object} Link
 * @property {String} name
 * @property {String} href
 */

/**
 * @typedef {Object} HostedLink
 * @property {String} host
 * @property {[Link]} links
 */

class Episode {
  /**
   * create a new episode
   * @param {HTMLDivElement} elem
   */
  constructor(elem) {
    this.size = elem.querySelector('div.size').textContent;
    /** @type {HTMLLinkElement} */
    let linkElem = elem.querySelector('div.link > a');
    /** @type {Link} */
    this.link = {
      name: linkElem.textContent,
      href: linkElem.href
    };
    /** @type {[HTMLLinkElement]} */
    let linksElems = Array.prototype.slice.call(elem.querySelectorAll(' div.links > a'));
    /** @type{[HostedLink]} */
    this.links = [];
    linksElems.map(el => {
      /** @type {Link} */
      let result = {
        href: el.href,
        name: el.textContent
      };
      return result;
    }).forEach(lnk => {
      let adr = url.parse(lnk.href);
      let items = this.links.map((v, i) => ({key: i, value: v})).filter(_ => _.value.host == adr.host);
      if(items.length <= 0) {
        this.links.push({
          host: adr.host,
          links: [lnk]
        })
      } else {
        items.forEach(item => {
          this.links[item.key].links.push(lnk);
        });
      }
    });
  }
}

module.exports = Episode;