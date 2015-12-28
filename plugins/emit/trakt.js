'use strict';

module.exports = function (program, pluginConfig, cache) {
  var traktService = require('../../services/trakt')(program, pluginConfig, cache);

  return {
    getWatchlist: function (done) {
      var emitEpisodes = function (entities) {
        return entities.map(function (entity) {
          return {
            name: entity.show.title,
            path: entity.show.title,
            season: 0,
            episode: 0
          };
        });
      };

      traktService.authAction(function (trakt, next) {
        trakt.sync.watchlist.get({type: 'shows'})
        .then(function (entities) {
          next(null, emitEpisodes(entities));
        }, next);
      }, done);
    },
    getCollection: function (done) {
      var emitEpisodes = function (entities) {
        return entities.map(function (entity) {
          return entity.seasons.map(function (season) {
            return season.episodes.map(function (episode) {
              return {
                name: entity.show.title,
                path: entity.show.title,
                season: season.number,
                episode: episode.number
              };
            });
          });
        });
      };

      traktService.authAction(function (trakt, next) {
        trakt.sync.collection.get({type: 'shows'})
        .then(function (entities) {
          next(null, emitEpisodes(entities));
        }, next);
      }, done);
    }
  };
};
