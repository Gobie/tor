'use strict';

var async = require('async');
var kickass = require('./search/kickass');
var tpb = require('./search/tpb');

module.exports = function(query, next) {
  async.parallel({
    kickass: function(next) {
      kickass(query, next);
    },
    tpb: function(next) {
      tpb(query, next);
    },
  }, function (err, res) {
    if (err) return next(err);
    next(null , [].concat(res.tpb, res.kickass));
  });
}
