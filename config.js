const os = require('os');
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const YAML = require('yaml');

let dir = path.join(os.homedir(), '.atosho');
if(!fs.existsSync(dir)) {
  shelljs.mkdir('-p', dir);
}

class Config {
  constructor(name, defaultData) {
    this.path = path.join(os.homedir(), '.atosho', `${name}.yml`);

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.save = this.save.bind(this);
    this.load = this.load.bind(this);

    if(fs.existsSync(this.path)) {
      this.load();
    } else {
      this.data = defaultData;
      this.save();
    }
  }

  /**
   * sets a key in the config
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this.data[key] = value;
  }

  /**
   * gets the value for a key in the config
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this.data[key];
  }

  save() {
    fs.writeFileSync(this.path, YAML.stringify(this.data));
  }

  load() {
    this.data = YAML.parse(fs.readFileSync(this.path).toString('utf8'));
  }
}

module.exports = {
  Config,
  default: new Config('default', {

  })
};