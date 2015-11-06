'use strict';

var exec = require('child_process').exec;
var debug = require('debug')('modules:download-torrents');
var async = require('async');
var pad = require('pad');
var formatters = require('../lib/formatters');

module.exports = function (synologyOptions, destPath, downloadEpisodes, options, done) {
  var synology = require('../lib/synology')(synologyOptions);

  async.mapSeries(downloadEpisodes, function (downloadEpisode, next) {
    var torrentLink = downloadEpisode.torrent.torrentLink
    var destination = destPath + downloadEpisode.episode.name + '/Season ' + pad(2, downloadEpisode.episode.season, '0');

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
      var query = downloadEpisode.episode.name + ' ' + formatters.episode(downloadEpisode.episode.season, downloadEpisode.episode.episode);
      var ratio = downloadEpisode.torrent.seeders + '/' + downloadEpisode.torrent.leechers;
      var source = downloadEpisode.torrent.source;
      console.log('[INFO] downloading %s [%s, %s]', query, ratio, source);
      synology.download(torrentLink, destination, options.dryRun, next);
    });

  }, done);
}

