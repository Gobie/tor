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
    .version('0.0.1')
    .description('download all missing episodes')
    .action(function (globPath, program) {
      debug('[options] dry run', program.dryRun);
      debug('[options] glob path', globPath);

      async.waterfall([
        function (next) {
          findMissingEpisodes(globPath, next);
        },
        function (missingEpisodes, next) {
          console.log('Missing %s episodes', missingEpisodes.length);
          searchTorrents(missingEpisodes, next);
        },
        function (downloadEpisodes, next) {
          console.log('Found %s episodes on torrent sites', downloadEpisodes.length);
          var options = {
            protocol: 'http',
            host: '***REMOVED***',
            port: '***REMOVED***',
            account: '***REMOVED***',
            passwd: '***REMOVED***'
          }
          downloadTorrents(program.dryRun, options, '***REMOVED***', downloadEpisodes, next);
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
