'use strict';

var debug = require('debug')('modules:search-torrents');
var async = require('async');
var _ = require('lodash')
var search = require('../lib/search')
var formatters = require('../lib/formatters')

module.exports = function(missingEpisodes, done) {
  var MAX_SIZE = 1.5*Math.pow(1024, 3); // 1GB
  var MIN_SIZE = 50*Math.pow(1024, 2); // 50MB

  async.map(missingEpisodes, function (missingEpisode, next) {
    var query = missingEpisode.name + ' ' + formatters.episode(missingEpisode.season, missingEpisode.episode);
    search(query, function(err, res) {
      if (err) {
        debug('for %s wasn\'t found any torrent', query);
        return next();
      }
      debug('for %s was found %s torrents', query, res.results.length);

      // TODO(mbrasna) handle quality, size, duplicates, etc
      res.results = _.filter(res.results, function (torrent) {
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

      debug('for %s remained %s torrents', query, res.results.length);
      return next(null, {episode: missingEpisode, torrent: res.results[0]});
    });
  }, function (err, res) {
    done(err, _.filter(res, Boolean));
  });
}
