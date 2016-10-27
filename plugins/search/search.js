'use strict';

var async = require('async');
var _ = require('lodash');
var rarbg = require('./providers/rarbg');
var bitsnoop = require('./providers/bitsnoop');
var torrentproject = require('./providers/torrentproject');
var tpb = require('./providers/tpb');

module.exports = function (program, query, next) {
  query = query.replace(/[':]/, '');

  var providers = [rarbg, bitsnoop, torrentproject, tpb];
  async.parallel(_.map(providers, function (provider) {
    return function (next) {
      provider(program, query, next);
    };
  }), function (e, res) {
    // No error should ever get here, search plugins should always return []
    if (e) {
      program.log.error('searching torrents', e);
      next(e);
      return;
    }

    var torrents = _(res)
      .flatten()
      .sortByOrder(['seeders'], ['desc']);
    next(null, torrents.value());
  });
};
