'use strict';

// Disabled: It is dead

var _ = require('lodash');
var zlib = require('zlib');
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var search = function (options, callback) {
  _.defaults(options, {timeout: 10000});
  var chunks = [];
  var req = request(options);
  req.on('error', callback);
  var res = req.pipe(zlib.createGunzip());
  res.on('error', callback);
  res.on('data', function (chunk) {
    chunks.push(chunk);
  });
  res.on('end', function () {
    try {
      parser.parseString(Buffer.concat(chunks).toString(), callback);
    } catch (e) {
      callback(e);
    }
  });
};

module.exports = function (program, query, done) {
  program.log.debug('kat: searching for %s', query);

  search({
    url: 'https://kat.cr/usearch/' + encodeURIComponent(query) + '%20category%3Atv%20is_safe%3A1/?rss=1&field=seeders&sorder=desc'
  }, function (e, results) {
    if (e) {
      program.log.error('kat', e);
      return done(null, []);
    }
    if (!results) {
      program.log.debug('kat: found 0 torrents for %s', query);
      return done(null, []);
    }

    var torrents = results.rss.channel[0].item || [];
    program.log.debug('kat: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent.title[0],
        size: Number(torrent['torrent:contentLength'][0]),
        torrentLink: torrent.enclosure[0].$.url,
        seeders: Number(torrent['torrent:seeds'][0]),
        leechers: Number(torrent['torrent:peers'][0]),
        source: 'kickass'
      };
    }));
  });
};
