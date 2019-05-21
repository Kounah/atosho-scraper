const {Handler} = require('./index.js');
const Downloader = require('../downloader');

class OpenloadHandler extends Handler {
  /**
   * creates a new OpenloadHandler
   * @param {Object} props properties
   */
  constructor(props) {
    props.hosts = [
      'openload.co',
      'www.openload.co'
    ];
    super(props);

    this.execute = this.execute.bind(this);
  }

  async execute(episode) {
    return await super.execute(episode, (doc, resolve) => {
      /**@type {HTMLButtonElement} */
      let btn = doc.querySelector('#downloadTimer > a');
      btn.click();

      let checker = setInterval(() => {
        /**@type {HTMLLinkElement} */
        let dl = doc.querySelector('#realdl > a');
        if(typeof dl.href == 'string' && dl.href.length > 0) {
          clearInterval(checker);

          resolve({
            success: true,
            download: new Downloader(dl.href)
          });
        }
      }, 100);
    });
  }
}

module.exports = OpenloadHandler;