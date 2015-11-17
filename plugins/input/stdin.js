'use strict';

var debug = require('debug')('plugins:input:stdin');

module.exports = function(next) {
  var input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      input += chunk;
    }
  });
  process.stdin.on('end', function() {
    next(null, input.split('\n'));
  });
}
