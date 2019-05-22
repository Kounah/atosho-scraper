/* eslint-disable no-console */
/* eslint-disable no-undef */
const Handler = require('./index').Handler;
const Downloader = require('../../downloader');
const url = require('url');

module.exports = new Handler({
  hosts: [
    'openload.co',
    'www.openload.co'
  ],
  downloadUrl: function(page, res) {
    return new Promise(async resolve => {
      if(res.status() !== 200) resolve(false);

      // /**@type {HTMLButtonElement} */
      // let btn = document.querySelector('#downloadTimer > a');
      // btn.click();

      let dladdr = await await page.evaluate(async function() {
        return await new Promise(_resolve => {
          console.log('started waiting for download');
          let button = window.document.querySelector('#downloadTimer > a');
          console.log('button:', button);
          let checker = setInterval(function () {
            button.click();
            let dl = window.document.querySelector('#realdl > a');
            let href = dl.getAttribute('href');
            console.log('href:', href);
            if(typeof href == 'string' && href.length > 0) {
              _resolve(href);

              clearInterval(checker);
            }
          }, 1000);
        });
      });

      await page.close();

      let address = url.parse(res.url());
      address.pathname = dladdr;
      resolve(dladdr);
    });
  }
});