'use strict';

var _ = require('lodash');
var request = require('requestretry');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var search = function (options, done) {
  _.defaults(options, {timeout: 10000});
  request(options, function (e, res, body) {
    if (e) {
      return done(e);
    }
    parser.parseString(body, done);
  });
};

module.exports = function (program, query, done) {
  program.log.debug('limetorrents: searching for %s', query);

  search({
    url: 'https://www.limetorrents.info/searchrss/' + encodeURIComponent(query) + '/'
  }, function (e, results) {
    if (e) {
      program.log.error('limetorrents', e);
      return done(null, []);
    }

    var torrents = results.rss.channel[0].item || [];
    program.log.debug('limetorrents: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent.title[0],
        size: Number(torrent.size[0]),
        torrentLink: torrent.enclosure[0].$.url,
        seeders: Number(torrent.description[0].replace(/^Seeds\D+(\d+).+$/, '$1')),
        leechers: Number(torrent.description[0].replace(/^.+Leechers\D+(\d+)$/, '$1')),
        source: 'limetorrents'
      };
    }));
  });
};
