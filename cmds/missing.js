'use strict';

var debug = require('debug')('cmd:missing');
var async = require('async');

var config = require('../config');
var cache = require('../lib/load-cache')(config.cacheFile);
var emitEpisodes = require('../modules/emit-episodes');
var findMissingEpisodes = require('../modules/find-missing');
var searchTorrents = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');

module.exports = function(program) {

  program
    .command('missing')
    .option('-n, --dry-run', 'Dry run', false)
    .option('-d, --discover', 'Discover new series', false)
    .version('0.0.1')
    .description('download all missing episodes')
    .action(function (options) {
      async.waterfall([
        function (next) {
          emitEpisodes(config, next);
        },
        function (episodes, next) {
          console.log('Found %s episodes', episodes.length);
          findMissingEpisodes(episodes, options, config, cache.data, next);
        },
        function (episodes, next) {
          console.log('Missing %s episodes', episodes.length);
          searchTorrents(episodes, config, next);
        },
        function (episodes, next) {
          console.log('Found %s episodes on torrent sites', episodes.length);
          downloadTorrents(episodes, options, config, cache.data, next);
        }
      ], function (err, res) {
        cache.save();
        if (err) {
          console.log('[ERROR]', err);
          return;
        }
        console.log('Downloaded %s torrents', res.length);
      });
    });

};
