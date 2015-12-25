'use strict';

var async = require('async');
var config = require('../config');
var emitEpisodes = require('../modules/emit-episodes');
var findMissingEpisodes = require('../modules/find-missing');
var searchTorrents = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');

module.exports = function(program) {

  var addSeriesCollector = function (val, memo) {
    memo.push(val);
    return memo;
  }

  program
    .command('missing')
    .option('-n, --dry-run', 'Dry run', false)
    .option('--discover', 'Discover new series', false)
    .option('--ignore-cache', 'Ignore episode cache', false)
    .option('--add-series <value>', 'Add series', addSeriesCollector, [])
    .description('download all missing episodes')
    .action(function (options) {
      async.waterfall([
        function (next) {
          emitEpisodes(program, config, options, next);
        },
        function (episodes, next) {
          program.log.info('[stats] emitted %s episodes', episodes.length);
          findMissingEpisodes(program, episodes, options, next);
        },
        function (episodes, next) {
          program.log.info('[stats] missing %s episodes', episodes.length);
          searchTorrents(program, episodes, config, next);
        },
        function (episodes, next) {
          program.log.info('[stats] found %s episodes on torrent sites', episodes.length);
          downloadTorrents(program, episodes, options, config, next);
        }
      ], function (e, episodes) {
        program.config.save();
        if (e) return program.log.error(e);
        program.log.info('[stats] downloaded %s torrents', episodes.length);
      });
    });

};
