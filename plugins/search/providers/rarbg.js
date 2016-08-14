'use strict';

module.exports = function (program, query, done) {
  var rarbgService = require('../../../services/rarbg')(program);

  program.log.debug('rarbg: searching for %s', query);

  rarbgService.search({
    search_string: query, // eslint-disable-line camelcase
    sort: 'seeders',
    category: 'tv'
  }, function (e, results) {
    if (e) {
      program.log.error('rarbg', e);
      return done(null, []);
    }

    var torrents = results || [];
    program.log.debug('rarbg: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent.title,
        size: Number(torrent.size),
        torrentLink: torrent.download,
        seeders: Number(torrent.seeders),
        leechers: Number(torrent.leechers),
        source: 'rarbg'
      };
    }));
  });
};
