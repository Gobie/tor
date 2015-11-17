'use strict';

var path = require('path');
var debug = require('debug')('modules:find-missing');
var async = require('async');
var _ = require('lodash');
var lookup = require('../lib/lookup');
var formatters = require('../lib/formatters');

module.exports = function(episodes, options, config, cache, done) {
  async.waterfall([
    function (next) {
      next(null, _.groupBy(_.flatten(episodes), 'path'));
    },
    function (showsGroupedByName, next) {
      debug('shows', Object.keys(showsGroupedByName));
      async.map(Object.keys(showsGroupedByName), function (showName, next) {
        var season = 1;
        var episode = 1;
        var missing = [];

        cache.lastEpisodes[showName] || (cache.lastEpisodes[showName] = []);
        var lastEpisode = null;

        var quitOnNextSeasonJump = false;
        async.during(
          function (cb) {
            var SE = formatters.episode(season, episode);

            if (_.find(cache.lastEpisodes[showName], {season: season, episode: episode})) {
              debug('found in last episode cache %s %s', showName, SE);
              quitOnNextSeasonJump = true;

              season++;
              episode = 0;
              return cb(null, true);
            }

            if (_.find(showsGroupedByName[showName], {season: season, episode: episode})) {
              debug('owned %s %s', showName, SE);
              quitOnNextSeasonJump = false;

              // cache last episode of season
              if (lastEpisode) {
                cache.lastEpisodes[showName].push(lastEpisode);
                lastEpisode = null
              }

              return cb(null, true);
            }

            debug('looking up %s %s', showsGroupedByName[showName][0].title, SE);
            lookup(showsGroupedByName[showName][0].title, season, episode, options, config, function(err, found) {
              if (err) {
                return cb(null, false);
              }

              // maybe end of season, jump to next one
              if (!found) {
                debug('look up %s %s failed', showName, SE);
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
              debug('look up %s %s suceeded', showName, SE);
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
            console.log('[INFO] processed %s', showName);
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
