'use strict';

var debug = require('debug')('modules:search-torrents');
var async = require('async');
var pad = require('pad');

module.exports = function (synologyOptions, destPath, downloadEpisodes, options, done) {
  var synology = require('../lib/synology')(synologyOptions);

  async.mapSeries(downloadEpisodes, function (downloadEpisode, next) {
    var torrent = downloadEpisode.torrent.torrentLink
    var destination = destPath + downloadEpisode.episode.name + '/Season ' + pad(2, downloadEpisode.episode.season, '0');
    synology.download(torrent, destination, options.dryRun, next);
  }, done);
}

