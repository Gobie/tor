'use strict';

var debug = require('debug')('lib:lookup');
var request = require('request');
var formatters = require('./formatters');
var config = require('../config');

module.exports = function(title, season, episode, done) {
  if (!config.map[title]) {
    console.log("[ERROR] No serie id found for %s", title);
    return done("unknown serie")
  }

  var SE = formatters.episode(season, episode);
  var payload = {
    url: 'http://api.tvmaze.com/shows/' + config.map[title] + '/episodebynumber?season=' + season + '&number=' + episode
  };

  request(payload, function (error, response, body) {
    if (error) {
      debug("no show found for query '%s %s'", title, SE);
      debug(error);
      return done(error);
    }

    var data = JSON.parse(body);
    if (data && data.id) {
      debug("episode found for query '%s %s' -> '%s %s'", title, SE, data.name, data.number);
    } else {
      debug("episode wasn't found for query '%s %s'", title, SE);
    }
    return done(null, data && data.id);
  });
}
