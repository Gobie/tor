'use strict';

module.exports = function (program, pluginConfig, cache) {
  var traktService = require('../../services/trakt')(program, pluginConfig, cache);

  return {
    addToCollection: function (episode, done) {
      traktService.authAction(function (trakt, next) {
        var data = {
          shows: [{
            ids: {tvdb: cache.get('series:' + episode.episode.name + ':info:ids:thetvdb')},
            seasons: [{
              number: episode.episode.season,
              episodes: [{number: episode.episode.episode}]
            }]
          }]
        };

        program.log.debug('trakt: added to collection', episode);
        trakt.sync.collection.add(data)
        .then(function (res) {
          if (res.added.episodes !== 1 && res.existing.episodes !== 1) {
            program.log.error('trakt: saving episode had unexpected output', data, res);
          }
          next();
        }, function (e, r) {
          if (e) {
            program.log.error('trakt: saving episode had error output', e, data, r);
          }
          next(e, r);
        });
      }, done);
    },
    removeFromWatchlist: function (episode, done) {
      traktService.authAction(function (trakt, next) {
        program.log.debug('trakt: removed from watchlist', episode);
        trakt.sync.watchlist.remove({
          shows: [{
            ids: {tvdb: cache.get('series:' + episode.episode.name + ':info:ids:thetvdb')}
          }]
        })
        .then(function () {
          next();
        }, next);
      }, done);
    }
  };
};
