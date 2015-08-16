'use strict';

var debug = require('debug')('lib:search');
var kat = require('kat-api');

module.exports = function(query, done) {
  debug(query);

  kat.search({
    query: query,
    category: 'tv',
    min_seeds: '5',
    sort_by: 'seeders',
    order: 'desc',
    verified: 1,
    safety_filter: 1
  }).then(function (data) {
    done(null, data);
  }).catch(function (err) {
    done(err);
  });
}
