'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var lookup = require('../lib/lookup');
var formatters = require('../lib/formatters');

module.exports = function (program, episodes, options, done) {
  async.waterfall([
    function (next) {
      next(null, _.groupBy(episodes, 'path'));
    },
    function (showsGroupedByName, next) {
      program.log.debug('processing shows', Object.keys(showsGroupedByName));
      async.mapSeries(Object.keys(showsGroupedByName), function (showName, next) {
        async.waterfall([
          function (next) {
            lookup(program, showName, options, next);
          },
          function (episodes, next) {
            async.reduce(episodes, [], function (missing, episode, next) {
              var SE = formatters.episode(episode.season, episode.episode);

              if (!episode.airstamp || moment(episode.airstamp).isAfter(moment())) {
                program.log.debug('not yet aired %s %s', showName, SE);
              } else if (_.find(showsGroupedByName[showName], {season: episode.season, episode: episode.episode})) {
                program.log.debug('owned %s %s', showName, SE);
              } else {
                program.log.info('missing %s %s', showName, SE);
                missing.push({
                  name: showName,
                  season: episode.season,
                  episode: episode.episode
                });
              }
              next(null, missing);
            }, next);
          }
        ], function (e, missing) {
          if (e === 'unknown serie') {
            return next(null, []);
          }

          if (e) {
            return next(e);
          }

          if (missing.length === 0) {
            program.log.debug('%s (no missing)', showName);
          } else {
            program.log.info('%s (%s missing)', showName, missing.length);
          }
          next(null, missing);
        });
      }, function (e, missing) {
        if (e) {
          return next(e);
        }

        next(null, _.flatten(missing));
      });
    }
  ], done);
};
