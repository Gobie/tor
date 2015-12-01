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
    done(null, (results || []).map(function (result) {
      return {
        title: result['name'],
        size: bytes(result['size'].replace(/[i\s]/g, '')),
        torrentLink: result['magnetLink'],
        seeders: result['seeders'],
        leechers: result['leechers'],
        source: 'tpb'
      };
    }));
  }, function (err) {
    program.log.error('tpb', err);
    done(null, []);
  });
}
