'use strict';

// Disabled: lot of falsely active torrents

var _ = require('lodash');
var cloudscraper = require('cloudscraper');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var search = function (options, next) {
  _.defaults(options, {timeout: 10000, method: 'GET'});
  cloudscraper.request(options, function (e, res, body) {
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
  program.log.debug('torrentproject: searching for %s', query);

  search({
    url: 'http://torrentproject.se/rss/' + encodeURIComponent(query) + '/'
  }, function (e, results) {
    if (e) {
      program.log.error('torrentproject', e);
      return done(null, []);
    }
    if (!results) {
      program.log.debug('torrentproject: found 0 torrents for %s', query);
      return done(null, []);
    }

    var torrents = results.rss.channel[0].item || [];
    program.log.debug('torrentproject: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent.title[0],
        size: Number(torrent.description[0].match(/<size>(\d+)<\/size>/)[1]),
        torrentLink: torrent.enclosure[0].$.url,
        seeders: Number(torrent.description[0].match(/<seeds>(\d+)<\/seeds>/)[1]),
        leechers: Number(torrent.description[0].match(/<leechers>(\d+)<\/leechers>/)[1]),
        source: 'torrentproject'
      };
    }));
  });
};
