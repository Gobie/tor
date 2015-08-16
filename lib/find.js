'use strict';

var debug = require('debug')('lib:find');
var glob = require('glob');

module.exports = function(paths, done) {
  glob(paths, {}, done);
}


