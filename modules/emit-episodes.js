'use strict';

var path = require('path');
var debug = require('debug')('modules:emit-episodes');
var async = require('async');
var _ = require('lodash');
var parse = require('../lib/torrent-parser');
var inputFind = require('../plugins/input/find');
var inputStdin = require('../plugins/input/stdin');

module.exports = function(globs, done) {
  async.waterfall([
    function (next) {
      if (globs) {
        inputFind(globs, next);
      } else {
        inputStdin(next);
      }
    },
    function (filePaths, next) {
      var filtered = _.filter(filePaths, function (filePath) {
        return -1 !== _.indexOf(['.avi', '.mp4', '.mpg', '.mkv'], path.extname(filePath));
      });
      next(null, filtered)
    },
    function (filePaths, next) {
      async.map(filePaths, parse, next);
    }
  ], done);
}
