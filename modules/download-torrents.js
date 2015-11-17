'use strict';

var exec = require('child_process').exec;
var debug = require('debug')('modules:download-torrents');
var async = require('async');
var pad = require('pad');
var formatters = require('../lib/formatters');

module.exports = function (episodes, options, config, done) {
  var synology = require('../lib/synology')(config.output.synology.url);

  async.mapSeries(episodes, function (episode, next) {
    var torrentLink = episode.torrent.torrentLink
    var destination = config.output.synology.destPath + episode.episode.name + '/Season ' + pad(2, episode.episode.season, '0');

    debug('creating remote directory "' + destination + '"');
    var remoteCommands = [
      '[ -d \'' + destination + '\' ] || (',
      'mkdir -p \'' + destination + '\'',
      ' && chmod 0777 \'' + destination + '\'',
      ' && chown mbrasna:users \'' + destination + '\'',
      ')'
    ]
    var command = 'ssh nas "' + remoteCommands.join('') + '"';
    if (options.dryRun) command = 'echo "dry run"';
    exec(command, function (error, stdout, stderr) {
      if (error || stderr) return next(error || stderr);
      var query = episode.episode.name + ' ' + formatters.episode(episode.episode.season, episode.episode.episode);
      var ratio = episode.torrent.seeders + '/' + episode.torrent.leechers;
      var source = episode.torrent.source;
      console.log('[INFO] downloading %s [%s, %s]', episode.torrent.title, ratio, source);
      synology.download(torrentLink, destination, options.dryRun, next);
    });

  }, done);
}

