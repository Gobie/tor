'use strict';

var _ = require('lodash');
var async = require('async');
var filesystem = require('../plugins/emit/filesystem');
var traktFactory = require('../plugins/emit/trakt');

module.exports = function (program, config, options, done) {
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
    function (next) {
      var trakt = traktFactory(program, config.services.trakt, program.config);
      trakt.getWatchlist(next);
    }
  ], function (e, episodes) {
    if (e) {
      return done(e);
    }

    return done(null, _.flatten(episodes));
  });
};
