'use strict';

var path = require('path');
var async = require('async');
var _ = require('lodash');
var lookup = require('../lib/lookup');
var formatters = require('../lib/formatters');

module.exports = function(program, episodes, options, done) {
  async.waterfall([
    function (next) {
      next(null, _.groupBy(_.flatten(episodes), 'path'));
    },
    function (showsGroupedByName, next) {
      program.log.debug('processing shows', Object.keys(showsGroupedByName));
      async.mapSeries(Object.keys(showsGroupedByName), function (showName, next) {
        var season = 1;
        var episode = 1;
        var missing = [];
        var lastEpisode = null;

        var quitOnNextSeasonJump = false;
        async.during(
          function (cb) {
            var SE = formatters.episode(season, episode);

            if (program.config.get('series:' + showName + ':lastEpisodes:' + season) === episode) {
              program.log.debug('found in last episode cache %s %s', showName, SE);
              quitOnNextSeasonJump = true;

              season++;
              episode = 0;
              return cb(null, true);
            }

            if (_.find(showsGroupedByName[showName], {season: season, episode: episode})) {
              program.log.debug('owned %s %s', showName, SE);
              quitOnNextSeasonJump = false;

              // cache last episode of season
              if (lastEpisode) {
                program.config.set('series:' + showName + ':lastEpisodes:' + lastEpisode.season, lastEpisode.episode);
                lastEpisode = null
              }

              return cb(null, true);
            }

            if (program.config.get('series:' + showName + ':info:status') === 'Ended') {
              program.log.debug('serie %s ended', showName);
              return cb(null, false);
            }

            program.log.debug('looking up %s %s', showName, SE);
            lookup(program, showName, season, episode, options, function(err, found) {
              if (err) {
                return cb(null, false);
              }

              // maybe end of season, jump to next one
              if (!found) {
                program.log.debug('look up %s %s failed', showName, SE);
                // don't jump season twice
                if (quitOnNextSeasonJump) return cb(null, false);
                quitOnNextSeasonJump = true;

                // store possible last episode of season
                lastEpisode = {season: season, episode: episode};

                season++;
                episode = 0;
                return cb(null, true);
              }

              quitOnNextSeasonJump = false;
              program.log.debug('look up %s %s suceeded', showName, SE);
              // missing episode
              missing.push({
                name: showName,
                season: season,
                episode: episode
              });
              return cb(null, true);
            });
          },
          function (cb) {
            episode++;
            return cb();
          },
          function (err) {
            program.log.info('processed %s', showName);
            return next(err, missing);
          }
        );
      }, function (err, missing) {
        if (err) {
          return next(err);
        }
        next(null, _.flatten(missing));
      });
    }
  ], done);
}
