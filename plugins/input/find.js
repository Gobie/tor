'use strict';

var debug = require('debug')('plugins:input:find');
var glob = require('glob');

module.exports = function(paths, done) {
  glob(paths, {}, done);
}
