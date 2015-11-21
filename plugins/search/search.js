'use strict';

var async = require('async');
var kickass = require('./providers/kickass');
var tpb = require('./providers/tpb');
var limetorrents = require('./providers/limetorrents');

module.exports = function(query, next) {
  async.parallel({
    kickass: function(next) {
      kickass(query, next);
    },
    tpb: function(next) {
      tpb(query, next);
    },
    limetorrents: function(next) {
      return next(null, []);
      limetorrents(query, next); // TODO empty search
    },
  }, function (err, res) {
    // No error should ever get here, search plugins should always return []
    if (err) {
      console.log('[ERROR] search', err);
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
