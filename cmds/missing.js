'use strict';

var debug = require('debug')('cmd:missing');
var async = require('async');

var emitEpisodes = require('../modules/emit-episodes');
var findMissingEpisodes = require('../modules/find-missing');
var searchTorrents = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');
var cache = require('../lib/load-config')('cache.tor.json');

module.exports = function(program) {

  program
    .command('missing [globPath]')
    .option('-n, --dry-run', 'Dry run', false)
    .option('-d, --discover', 'Discover new series', false)
    .version('0.0.1')
    .description('download all missing episodes')
    .action(function (globPath, options) {
      async.waterfall([
        function (next) {
          emitEpisodes(globPath, next);
        },
        function (episodes, next) {
          console.log('Found %s episodes', episodes.length);
          findMissingEpisodes(episodes, options, cache.data, next);
        },
        function (missingEpisodes, next) {
          console.log('Missing %s episodes', missingEpisodes.length);
          searchTorrents(missingEpisodes, next);
        },
        function (downloadEpisodes, next) {
          console.log('Found %s episodes on torrent sites', downloadEpisodes.length);
          var url = {
            protocol: 'http',
            host: '***REMOVED***',
            port: '***REMOVED***',
            account: '***REMOVED***',
            passwd: '***REMOVED***'
          }
          downloadTorrents(url, '***REMOVED***', downloadEpisodes, options, next);
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
