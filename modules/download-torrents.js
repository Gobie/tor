'use strict';

var debug = require('debug')('modules:download-torrents');
var async = require('async');

module.exports = function (episodes, options, config, cache, done) {
  var trakt = require('../plugins/output/trakt')(config.output.trakt);
  var pushbullet = require('../plugins/output/pushbullet')(config.output.pushbullet);
  var synology = require('../plugins/output/synology')(config.output.synology);
  var customCommand = require('../plugins/output/customCommand')(config.output.customCommand);

  async.mapSeries(episodes, function (episode, next) {
    console.log('[INFO] downloading %s [%s, %s]',
      episode.torrent.title,
      episode.torrent.seeders + '/' + episode.torrent.leechers,
      episode.torrent.source
    );

    async.parallel([
      function (next) {
        if (options.dryRun) return next();
        trakt.addToCollection(episode, config, cache, next);
      },
      function (next) {
        if (options.dryRun) return next();
        pushbullet.push(episode, next);
      },
      function (next) {
        if (options.dryRun) return next();
        customCommand.exec(episode, next);
      },
      function (next) {
        if (options.dryRun) return next();
        synology.download(episode, next);
      }
    ], next);
  }, done);
}

