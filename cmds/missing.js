'use strict';

var debug = require('debug')('cmd:missing');
var async = require('async');
var _ = require('lodash');

var findMissingEpisodes = require('../modules/find-missing');
var searchTorrents = require('../modules/search-torrents');
var downloadTorrents = require('../modules/download-torrents');

module.exports = function(program) {

  program
    .command('missing <globPath>')
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
          searchTorrents(missingEpisodes, next);
        },
        function (downloadEpisodes, next) {
          var options = {
            protocol: 'http',
            host: '***REMOVED***',
            port: '***REMOVED***',
            account: '***REMOVED***',
            passwd: '***REMOVED***'
          }
          downloadTorrents(program.dryRun, options, '***REMOVED***', downloadEpisodes, next);
        }
      ], function (err) {
        if (err) {
          console.log('error', err);
          return;
        }
        console.log('Done !');
      });
    });

};
