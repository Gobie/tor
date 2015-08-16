'use strict';

var debug = require('debug')('lib:lookup');
var tvinfo = require('tvinfo');
var formatters = require('./formatters');

module.exports = function(title, season, episode, done) {
  var SE = formatters.episode(season, episode);

  tvinfo
  .episode(title, season, episode, true)
  .then(function (data) {
    if (data && data.episode) {
      debug("episode found for query '%s %s' -> '%s %s'", title, SE, data.name, data.episode.number);
    } else {
      debug("no episode found for query '%s %s'", title, SE);
    }
    return done(null, data);
  })
  .catch(function (err) {
    debug("no show found for query '%s %s'", title, SE);
    debug(err);
    return done(err);
  });
}
