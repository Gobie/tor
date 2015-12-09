'use strict';

var async = require('async');
var _ = require('lodash');
var kickass = require('./providers/kickass');
var tpb = require('./providers/tpb');
var limetorrents = require('./providers/limetorrents');

module.exports = function(program, query, next) {
  async.parallel({
    kickass: function(next) {
      kickass(program, query, next);
    },
    tpb: function(next) {
      tpb(program, query, next);
    },
    limetorrents: function(next) {
      return next(null, []);
      limetorrents(program, query, next); // TODO empty search
    },
  }, function (e, res) {
    // No error should ever get here, search plugins should always return []
    if (e) {
      program.log.error('searching torrents', e);
      next(e);
      return;
    }

    var torrents = _([])
      .concat(res.tpb, res.kickass, res.limetorrents)
      .sortByOrder(['seeders'], ['desc']);
    next(null , torrents.value());
  });
}
