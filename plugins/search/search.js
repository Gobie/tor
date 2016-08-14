'use strict';

var async = require('async');
var _ = require('lodash');
var tpb = require('./providers/tpb');
var rarbg = require('./providers/rarbg');

module.exports = function (program, query, next) {
  async.parallel({
    tpb: function (next) {
      tpb(program, query, next);
    },
    rarbg: function (next) {
      rarbg(program, query, next);
    }
  }, function (e, res) {
    // No error should ever get here, search plugins should always return []
    if (e) {
      program.log.error('searching torrents', e);
      next(e);
      return;
    }

    var torrents = _([])
      .concat(res.tpb, res.rarbg)
      .sortByOrder(['seeders'], ['desc']);
    next(null, torrents.value());
  });
};
