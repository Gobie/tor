'use strict';

var bytes = require('bytes');
var tpb = require('thepiratebay');
tpb.setUrl('http://thepiratebay.la');

module.exports = function (program, query, done) {
  program.log.debug('tpb: searching for %s', query);

  tpb.search(query, {
    category: 205,
    orderBy: 7
  }).then(function (results) {
    var torrents = results || [];
    program.log.debug('tpb: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent['name'],
        size: bytes(torrent['size'].replace(/[i\s]/g, '')),
        torrentLink: torrent['magnetLink'],
        seeders: torrent['seeders'],
        leechers: torrent['leechers'],
        source: 'tpb'
      };
    }));
  }, function (err) {
    program.log.error('tpb', err);
    done(null, []);
  });
}
