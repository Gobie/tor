'use strict';

var path = require('path');
var debug = require('debug')('modules:find-missing');
var async = require('async');
var pad = require('pad');
var _ = require('lodash');
var parse = require('../lib/torrent-parser');
var lookup = require('../lib/lookup');
var find = require('../lib/find');
var formatters = require('../lib/formatters');

module.exports = function(globs, done) {
  async.waterfall([
    function (next) {
      find(globs, next);
    },
    function (filePaths, next) {
      var filtered = _.filter(filePaths, function (filePath) {
        return -1 !== _.indexOf(['.avi', '.mp4', '.mpg', '.mkv'], path.extname(filePath));
      });
      next(null, filtered)
    },
    function (filePaths, next) {
      async.map(filePaths, parse, next);
    },
    function (shows, next) {
      next(null, _.groupBy(shows, 'title'));
    },
    function (showsGroupedByName, next) {
      debug('shows', Object.keys(showsGroupedByName));
      async.mapSeries(Object.keys(showsGroupedByName), function (showName, next) {
        var season = 1;
        var episode = 1;
        var missing = [];

        async.during(
          function (cb) {
            var SE = formatters.episode(season, episode);

            var found = _.find(showsGroupedByName[showName], {season: season, episode: episode});
            if (found) {
              debug('already have %s %s', showName, SE);
              return cb(null, true);
            }

            debug('looking up %s %s', showName, SE);
            lookup(showName, season, episode, function(err, res) {
              if (err) {
                return cb(null, false);
              }

              // newer than latest episode
              if (res && res.latestepisode) {
                var latest = res.latestepisode.number.split('x');
                var latestSeason = +latest[0];
                var latestEpisode = +latest[1];
                if (season >= latestSeason && episode > latestEpisode) {
                  debug("'%s %s' not yet released, latest is '%s'", showName, SE, formatters.episode(latestSeason, latestEpisode));
                  return cb(null, false);
                }
              }

              // maybe end of season, jump to next one
              if (!res.episode) {
                season++;
                episode = 0;
                return cb(null, true);
              }

              // missing episode
              missing.push({
                name: res.name,
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
            console.log('during');
            return next(err, missing);
          }
        );
      }, function (err, missing) {
        console.log('after');
        if (err) {
          return next(err);
        }
        next(null, _.flatten(missing));
      });
    }
  ], done);
}
