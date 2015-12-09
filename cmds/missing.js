'use strict';

var async = require('async');
var config = require('../config');
var emitEpisodes = require('../modules/emit-episodes');
var findMissingEpisodes = require('../modules/find-missing');
var searchTorrents = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');

module.exports = function(program) {

  program
    .command('missing')
    .option('-n, --dry-run', 'Dry run', false)
    .option('--discover', 'Discover new series', false)
    .version('0.0.1')
    .description('download all missing episodes')
    .action(function (options) {
      async.waterfall([
        function (next) {
          emitEpisodes(program, config, next);
        },
        function (episodes, next) {
          program.log.info('emitted %s episodes', episodes.length);
          findMissingEpisodes(program, episodes, options, next);
        },
        function (episodes, next) {
          program.log.info('missing %s episodes', episodes.length);
          searchTorrents(program, episodes, config, next);
        },
        function (episodes, next) {
          program.log.info('found %s episodes on torrent sites', episodes.length);
          downloadTorrents(program, episodes, options, config, next);
        }
      ], function (err, res) {
        program.config.save();
        if (err) {
          program.log.error(err);
          return;
        }
        program.log.info('downloaded %s torrents', res.length);
      });
    });

};
