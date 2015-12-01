'use strict';

var async = require('async');
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
  }, function (err, res) {
    // No error should ever get here, search plugins should always return []
    if (err) {
      program.log.error('searching torrents', err);
      next(err);
      return;
    }

    var torrents = [].concat(res.tpb, res.kickass, res.limetorrents);
    torrents.sort(function(a, b) {
      return b.seeders - a.seeders;
    });
    next(null , torrents);
  });
}
