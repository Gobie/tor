'use strict';

var path = require('path');
var debug = require('debug')('modules:emit-episodes');
var async = require('async');
var _ = require('lodash');
var parse = require('../lib/torrent-parser');
var glob = require('../plugins/input/glob');
var customCommand = require('../plugins/input/customCommand');

module.exports = function(config, done) {
  async.waterfall([
    function (next) {
      if (config.input.globs) {
        glob(config.input.globs, next);
      } else if (config.input.customCommand) {
        customCommand(config.input.customCommand).exec(next);
      } else {
        console.log('[ERROR] No input specified');
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
