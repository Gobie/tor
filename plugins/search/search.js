'use strict';

var async = require('async');
var _ = require('lodash');
var kickass = require('./providers/kickass');
var tpb = require('./providers/tpb');

module.exports = function (program, query, next) {
  async.parallel({
    kickass: function (next) {
      kickass(program, query, next);
    },
    tpb: function (next) {
      tpb(program, query, next);
    }
  }, function (e, res) {
    // No error should ever get here, search plugins should always return []
    if (e) {
      program.log.error('searching torrents', e);
      next(e);
      return;
    }

    var torrents = _([])
      .concat(res.tpb, res.kickass)
      .sortByOrder(['seeders'], ['desc']);
    next(null, torrents.value());
  });
};
