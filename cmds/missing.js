'use strict';

var debug = require('debug')('cmd:missing');
var async = require('async');
var _ = require('lodash');

var findMissingEpisodes = require('../modules/find-missing');
var searchTorrents = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');

module.exports = function(program) {

  program
    .command('missing [globPath]')
    .option('-n, --dry-run', 'Dry run', false)
    .option('--new-series', 'New series', false)
    .version('0.0.1')
    .description('download all missing episodes')
    .action(function (globPath, options) {
      async.waterfall([
        function (next) {
          findMissingEpisodes(globPath, options, next);
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
        if (err) {
          console.log('[ERROR]', err);
          return;
        }
        console.log('Downloaded %s torrents', res.length);
      });
    });

};