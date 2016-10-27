'use strict';

var _ = require('lodash');
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var search = function (options, next) {
  _.defaults(options, {timeout: 10000});
  request(options, function (e, res, body) {
    if (e) {
      return next(e);
    }

    if (res.statusCode !== 200) {
      return next('[' + res.statusCode + '] ' + res.statusMessage);
    }

    try {
      parser.parseString(body, next);
    } catch (e) {
      return next(e);
    }
  });
};

module.exports = function (program, query, done) {
  program.log.debug('bitsnoop: searching for %s', query);

  search({
    url: 'https://bitsnoop.com/search/video/' + encodeURIComponent(query) + '/s/d/1/?fmt=rss'
  }, function (e, results) {
    if (e) {
      program.log.error('bitsnoop', e);
      return done(null, []);
    }
    if (!results) {
      program.log.debug('bitsnoop: found 0 torrents for %s', query);
      return done(null, []);
    }

    var torrents = results.rss.channel[0].item || [];
    program.log.debug('bitsnoop: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent.title[0],
        size: Number(torrent.size[0]),
        torrentLink: torrent.torrent[0].magnetURI[0],
        seeders: Number(torrent.numSeeders[0]),
        leechers: Number(torrent.numLeechers[0]),
        source: 'bitsnoop'
      };
    }));
  });
};
