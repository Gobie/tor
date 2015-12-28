'use strict';

var _ = require('lodash');
var async = require('async');
var filesystem = require('../plugins/emit/filesystem');

module.exports = function (program, config, options, done) {
  var trakt = require('../plugins/emit/trakt')(program, config.services.trakt, program.config);

  async.parallel([
    function (next) {
      filesystem(program, config, next);
    },
    function (next) {
      next(null, options.addSeries.map(function (series) {
        return {
          name: series,
          path: series,
          season: 0,
          episode: 0
        };
      }));
    },
    trakt.getWatchlist.bind(trakt),
    trakt.getCollection.bind(trakt)
  ], function (e, episodes) {
    if (e) {
      return done(e);
    }

    return done(null, _.flattenDeep(episodes).map(function (episode) {
      // path is used as cache key, keys are namespaced by :
      episode.path = episode.path.replace(/:/, '');
      return episode;
    }));
  });
};
