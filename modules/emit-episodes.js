'use strict';

var _ = require('lodash');
var async = require('async');
var filesystem = require('../plugins/emit/filesystem');

module.exports = function(program, config, options, done) {
  async.parallel([
    function (next) {
      filesystem(program, config, next);
    },
    function (next) {
      next(null, options.addSeries.map(function(series) {
        return {
          name: series,
          path: series,
          season: 0,
          episode: 0
        }
      }));
    }
  ], function(e, episodes) {
    if (e) return done(e);
    return done(null, _.flatten(episodes));
  });
}
