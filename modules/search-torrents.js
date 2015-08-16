'use strict';

var debug = require('debug')('modules:search-torrents');
var async = require('async');
var _ = require('lodash')
var search = require('../lib/search')
var formatters = require('../lib/formatters')

module.exports = function(missingEpisodes, done) {
  var MAX_SIZE = Math.pow(1024, 3);

  async.map(missingEpisodes, function (missingEpisode, next) {
    var query = missingEpisode.name + ' ' + formatters.episode(missingEpisode.season, missingEpisode.episode);
    search(query, function(err, res) {
      if (err) {
        debug('for query %s wasn\'t found any torrent', query);
        return next();
      }
      debug('for query %s found %s results', query, res.results.length);

      res.results = _.filter(res.results, function (torrent) {
        if (torrent.size >= MAX_SIZE) {
          debug('torrent %s filtered out, size %s > %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(MAX_SIZE));
          return false;
        }
        return true;
      });

      // TODO(mbrasna) handle quality, size, duplicates, etc
      debug('for query %s filtered out %s results', query, res.results.length);
      return next(null, {episode: missingEpisode, torrent: res.results[0]});
    });
  }, function (err, res) {
    done(err, _.filter(res, Boolean));
  });
}
