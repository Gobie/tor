'use strict';

var path = require('path');
var debug = require('debug')('modules:find-missing');
var async = require('async');
var pad = require('pad');
var _ = require('lodash');
var jsonfile = require('jsonfile');
var parse = require('../lib/torrent-parser');
var lookup = require('../lib/lookup');
var find = require('../lib/find');
var formatters = require('../lib/formatters');

var lastEpisodesCache = 'last-episodes-cache.tor.json';

module.exports = function(globs, options, done) {
  var lastEpisodes = {};
  try {
    lastEpisodes = jsonfile.readFileSync(lastEpisodesCache);
  } catch (e) {}

  async.waterfall([
    function (next) {
      if (globs) return find(globs, next);

      var input = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
          input += chunk;
        }
      });
      process.stdin.on('end', function() {
        next(null, input.split('\n'));
      });
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
      next(null, _.groupBy(_.flatten(shows), 'path'));
    },
    function (showsGroupedByName, next) {
      debug('shows', Object.keys(showsGroupedByName));
      async.map(Object.keys(showsGroupedByName), function (showName, next) {
        var season = 1;
        var episode = 1;
        var missing = [];

        lastEpisodes[showName] || (lastEpisodes[showName] = []);
        var lastEpisode = null;

        var quitOnNextSeasonJump = false;
        async.during(
          function (cb) {
            var SE = formatters.episode(season, episode);

            if (_.find(lastEpisodes[showName], {season: season, episode: episode})) {
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
                lastEpisodes[showName].push(lastEpisode);
                lastEpisode = null
              }

              return cb(null, true);
            }

            debug('looking up %s %s', showsGroupedByName[showName][0].title, SE);
            lookup(showsGroupedByName[showName][0].title, season, episode, options, function(err, found) {
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
        jsonfile.writeFileSync(lastEpisodesCache, lastEpisodes);
        next(null, _.flatten(missing));
      });
    }
  ], done);
}
