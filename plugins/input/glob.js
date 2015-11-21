'use strict';

var debug = require('debug')('plugins:input:find');
var glob = require('glob');

module.exports = function(patterns, done) {
  glob(patterns, {}, done);
}
