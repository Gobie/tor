'use strict';

var debug = require('debug')('lib:search-tpb');
var bytes = require('bytes');
var tpb = require('thepiratebay');
tpb.setUrl('http://thepiratebay.la');

module.exports = function (query, done) {
  debug('searching for %s', query);

  tpb.search(query, {
    category: 205,
    orderBy: 7
  }).then(function (results) {
    done(null, (results || []).map(function (release) {
      return {
        title: release['name'],
        size: bytes(release['size'].replace(/[i\s]/g, '')),
        torrentLink: release['magnetLink'],
        seeders: release['seeders'],
        leechers: release['leechers'],
        source: 'tpb'
      };
    }));
  }).catch(function (err) {
    console.log('[ERROR] tpb', err);
    done(null, [])
  });
}
