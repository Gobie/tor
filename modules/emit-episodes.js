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
          episode: 0,
          source: 'options'
        };
      }));
    },
    function (next) {
      if (!options.trakt) {
        return next(null, []);
      }
      trakt.getWatchlist(function (e, episodes) {
        if (e) {
          program.log.error('trakt: failed to get watchlist', e);
        }
        return next(null, episodes || []);
      });
    },
    function (next) {
      if (!options.trakt) {
        return next(null, []);
      }
      trakt.getCollection(function (e, episodes) {
        if (e) {
          program.log.error('trakt: failed to get collection', e);
        }
        return next(null, episodes || []);
      });
    }
  ], function (e, episodes) {
    if (e) {
      return done(e);
    }

    // TODO document structure of episodes
    // TODO deduplicate episodes by name/season/episode
    return done(null, _.flattenDeep(episodes).map(function (episode) {
      // path is used as cache key, keys are namespaced by :
      episode.path = episode.path.replace(/:/, '');
      return episode;
    }));
  });
};
