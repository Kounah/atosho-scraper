const process = require('process');

// function joinParams(...params) {
//   return params
//     .map(param => {
//       if(typeof param == 'object') {
//         return param.constructor.name + ' ' + JSON.stringify(param, null, '  ');
//       } else if(typeof param == 'function') {
//         if(param.prototype && param.prototype.constructor) {
//           return '[Class: ' + param.prototype.constructor.name + ']';
//         } else {
//           return '[Function: ' + param.name + ']';
//         }
//       } else {
//         return param;
//       }
//     })
//     .join(' ');
// }

function log(...params) {
  if(process.env['atosho_debug']) {
    // process.stdout.write(joinParams(...params) + '\n');
    /* eslint no-console: off */
    console.log(...params);
  }
}

function error(...params) {
  if(process.env['atosho_debug']) {
    // process.stderr.write(joinParams(...params) + '\n');
    console.error(...params);
  }
}

module.exports = {
  log,
  error
};