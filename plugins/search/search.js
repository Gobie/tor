'use strict';

var async = require('async');
var _ = require('lodash');
var rarbg = require('./providers/rarbg');
var bitsnoop = require('./providers/bitsnoop');

module.exports = function (program, query, next) {
  query = query.replace(/[':]/, '');

  async.parallel({
    rarbg: function (next) {
      rarbg(program, query, next);
    },
    bitsnoop: function (next) {
      bitsnoop(program, query, next);
    }
  }, function (e, res) {
    // No error should ever get here, search plugins should always return []
    if (e) {
      program.log.error('searching torrents', e);
      next(e);
      return;
    }

    var torrents = _([])
      .concat(res.rarbg, res.bitsnoop)
      .sortByOrder(['seeders'], ['desc']);
    next(null, torrents.value());
  });
};
