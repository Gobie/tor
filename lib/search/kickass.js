'use strict';

var debug = require('debug')('lib:search-kickass');
var kat = require('kat-api');

module.exports = function(query, done) {
  debug('searching for %s', query);

  kat.search({
    query: query,
    category: 'tv',
    min_seeds: '5',
    sort_by: 'seeders',
    order: 'desc',
    verified: 1,
    safety_filter: 1
  }).then(function (data) {
    done(null, (data.results || []).map(function(result) {
      return {
        title: result['title'],
        size: result['size'],
        torrentLink: result['torrentLink'],
        seeders: result['seeds'],
        leechers: result['leechs'],
        source: 'kickass'
      }
    }));
  }).catch(function (err) {
    if (err instanceof Error && err.message === 'No data') return done(null, []);
    console.log('[ERROR] kickass', err);
    done(err)
  });
}
