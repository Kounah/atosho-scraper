const path = require('path');
const os = require('os');
const Config = require('../../config').Config;


module.exports = new Config('puppeteer', {
  tmpDir: path.join(os.homedir(), '.atoshodl'),
  extensions: [],
  args: []
});
