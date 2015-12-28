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

        try {
          trakt.sync.collection.add(data)
          .then(function (res) {
            if (res.added.episodes !== 1 && res.existing.episodes !== 1) {
              program.log.error('trakt: saving episode failed', data, res);
            }
            next();
          }, next);
        } catch (e) {
          next(e.stack);
        }
      }, done);
    }
  };
};
