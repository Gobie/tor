'use strict';

var debug = require('debug')('modules:search-torrents');
var async = require('async');
var formatters = require('../lib/formatters');
var search = require('../plugins/search/search');
var filtersFactory = require('../plugins/search/filters');

module.exports = function(episodes, config, done) {
  var filter = filtersFactory(config.search.filters);

  async.map(episodes, function (episode, next) {
    var query = episode.name + ' ' + formatters.episode(episode.season, episode.episode);
    debug('searching for %s', query);
    search(query, function(err, torrents) {
      if (err || !torrents.length) {
        console.log('[INFO] episode %s wasn\'t found', query);
        return next();
      }
      debug('%s torrents found for %s', torrents.length, query);

      var acceptedTorrents = filter(torrents);
      debug('%s/%s torrents remained for %s', acceptedTorrents.length, torrents.length, query);
      console.log('[INFO] episode %s was found', query);

      return next(null, {episode: episode, torrent: acceptedTorrents[0]});
    });
  }, function (err, res) {
    done(err, res.filter(Boolean));
  });
}
