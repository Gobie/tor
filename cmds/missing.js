'use strict';

var path = require('path');
var async = require('async');
var moment = require('moment');
var emitEpisodes = require('../modules/emit-episodes');
var findMissingEpisodes = require('../modules/find-missing');
var searchTorrentsModuleFactory = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');

module.exports = function (program) {
  var addSeriesCollector = function (val, memo) {
    memo.push(val);
    return memo;
  };

  program
    .command('missing')
    .option('-n, --dry-run', 'Dry run', false)
    .option('--discover', 'Discover new series', false)
    .option('--no-cache', 'Disable episode cache')
    .option('--no-trakt', 'Disable trakt.tv as source')
    .option('--add-series <value>', 'Add series', addSeriesCollector, [])
    .option('--config-file <value>', 'Path to app config', 'config.js')
    .description('download all missing episodes')
    .action(function (options) {
      var config = require(path.resolve(__dirname, '../', options.configFile));
      var searchTorrentsModule = searchTorrentsModuleFactory(program, config);

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
          searchTorrentsModule(episodes, next);
        },
        function (episodes, next) {
          program.log.info('[stats] found %s episodes on torrent sites', episodes.length);
          downloadTorrents(program, episodes, options, config, next);
        }
      ], function (e, episodes) {
        // cleanup: remove series, which were not accessed in last 6 months
        var shows = program.config.get('series');
        for (var showName in shows) {
          if (moment().subtract(6, 'month').isAfter(shows[showName].accessed)) {
            delete shows[showName];
          }
        }
        program.config.set('series', shows);

        program.config.save();
        if (e) {
          return program.log.error(e);
        }

        program.log.info('[stats] downloaded %s torrents', episodes.length);
      });
    });
};
