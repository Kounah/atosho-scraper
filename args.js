const process = require('process');

let result = {};
if(process.argv.length > 2) {
  let args = process.argv.slice(2, process.argv.length);
  args
    .map((arg, i) => ({
      i: i,
      v: arg
    }))
    .filter(arg => arg.v.startsWith('--'))
    .map(arg => args.length > arg.i + 1 ? {
      k: 'atosho_' + arg.v.substr(2, arg.v.length - 1).split('-').join('_').toLowerCase(),
      v: args[arg.i + 1]
    } : undefined)
    .filter(arg => arg != undefined)
    .forEach(arg => {
      result[arg.k] = arg.v;
      process.env[arg.k] = arg.v;
    });
}

module.exports = result;