'use strict';

module.exports = function (program, pluginConfig, cache) {
  var traktService = require('../../services/trakt')(program, pluginConfig, cache);

  return {
    getWatchlist: function (done) {
      traktService.authAction(function (trakt, next) {
        try {
          trakt.sync.watchlist.get({type: 'shows'})
          .then(function (entities) {
            next(null, entities.map(function (entity) {
              return {
                name: entity.show.title,
                path: entity.show.title,
                season: 0,
                episode: 0
              };
            }));
          }, next);
        } catch (e) {
          next(e.stack);
        }
      }, done);
    }
  };
};
