'use strict';

var glob = require('glob');

module.exports = function(patterns, done) {
  glob(patterns, {}, done);
}
