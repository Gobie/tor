'use strict';

var path = require('path');
var async = require('async');
var _ = require('lodash');
var parse = require('../lib/torrent-parser');
var glob = require('../plugins/input/glob');
var customCommand = require('../plugins/input/customCommand');

module.exports = function(program, config, done) {
  async.waterfall([
    function (next) {
      if (config.input.globs) {
        glob(config.input.globs, next);
      } else if (config.input.customCommand) {
        customCommand(program, config.input.customCommand).exec(next);
      } else {
        program.log.error('no input specified');
      }
    },
    function (filePaths, next) {
      // TODO extract to input filters
      var allowedExt = ['.avi', '.mp4', '.mpg', '.mkv'];
      var regex = /(Extras|Sample|E00)/;

      program.log.debug('%s files found', filePaths.length);
      var filtered = _.filter(filePaths, function (filePath) {
        return -1 !== _.indexOf(allowedExt, path.extname(filePath)) && !regex.test(filePath);
      });

      program.log.debug('%s files remained after filter', filtered.length);
      next(null, filtered)
    },
    function (filePaths, next) {
      async.map(filePaths, parse.bind(null, program, config), next);
    }
  ], done);
}
