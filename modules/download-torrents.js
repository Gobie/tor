'use strict';

var async = require('async');

module.exports = function (program, episodes, options, config, done) {
  var trakt = require('../plugins/output/trakt')(program, config.services.trakt, program.config);
  var pushbullet = require('../plugins/output/pushbullet')(program, config.output.pushbullet);
  var synology = require('../plugins/output/synology')(program, config.output.synology);
  var customCommand = require('../plugins/output/customCommand')(program, config.output.customCommand);

  async.mapSeries(episodes, function (episode, next) {
    program.log.info('downloading %s [%s, %s]',
      episode.torrent.title,
      episode.torrent.seeders + '/' + episode.torrent.leechers,
      episode.torrent.source
    );

    async.parallel([
      function (next) {
        if (options.dryRun) {
          return next();
        }

        trakt.addToCollection(episode, next);
      },
      function (next) {
        if (options.dryRun) {
          return next();
        }

        pushbullet.push(episode, next);
      },
      function (next) {
        if (options.dryRun) {
          return next();
        }

        customCommand.exec(episode, next);
      },
      function (next) {
        if (options.dryRun) {
          return next();
        }

        synology.download(episode, next);
      }
    ], next);
  }, done);
};

