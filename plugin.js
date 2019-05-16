const jsdom = require('jsdom');

class Plugin {
  constructor() {
    console.log('plugin created: ', __filename);
  }

  /**
   * method to override to get the file link from a document
   * @param {HTMLDocument} document
   */
  async getFileLink(document) {

  }
}

module.exports = Plugin;