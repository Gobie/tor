'use strict';

var debug = require('debug')('modules:search-torrents');
var async = require('async');
var search = require('../lib/search')
var formatters = require('../lib/formatters')

module.exports = function(missingEpisodes, done) {
  var MAX_SIZE = 1.5*Math.pow(1024, 3); // 1GB
  var MIN_SIZE = 50*Math.pow(1024, 2); // 50MB

  async.map(missingEpisodes, function (missingEpisode, next) {
    var query = missingEpisode.name + ' ' + formatters.episode(missingEpisode.season, missingEpisode.episode);
    debug('searching for %s', query);
    search(query, function(err, results) {
      if (err || !results.length) {
        console.log('[INFO] episode %s wasn\'t found', query);
        return next();
      }
      debug('%s torrents found for %s', results.length, query);

      // TODO(mbrasna) handle quality, size, duplicates, etc
      var filteredResults = (results || []).filter(function (torrent) {
        if (torrent.size >= MAX_SIZE) {
          debug('%s skipped, size %s > %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(MAX_SIZE));
          return false;
        }
        if (torrent.size <= MIN_SIZE) {
          debug('%s skipped, size %s < %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(MIN_SIZE));
          return false;
        }
        if (/\b(french|russian)\b/i.test(torrent.title)) {
          debug('%s skipped, blocked phrases', torrent.title);
          return false;
        }
        return true;
      });

      debug('%s/%s torrents remained for %s', filteredResults.length, results.length, query);
      console.log('[INFO] episode %s was found', query);
      return next(null, {episode: missingEpisode, torrent: filteredResults[0]});
    });
  }, function (err, res) {
    done(err, res.filter(Boolean));
  });
}
