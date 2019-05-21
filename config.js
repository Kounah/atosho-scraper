const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} Config
 * @property {Object} pluginSettings
 */

/**@type {Config} */
let config = {
  pluginSettings: {

  },
  handlerSettings: {
    targetDir: path.join(os.homedir(), 'download/atosho')
  }
};

let cfgPath = path.join(os.homedir(), '.atoshorc.json');

if(fs.existsSync(cfgPath)) {
  config = JSON.parse(fs.readFileSync(cfgPath).toString('utf8'));
} else {
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, '  '));
}

module.exports = config;