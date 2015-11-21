'use strict';

var debug = require('debug')('lib:lookup');
var request = require('request');
var moment = require('moment');
var formatters = require('./formatters');

var getPossibleShows = function(title, done) {
  var payload = {
    url: 'http://api.tvmaze.com/search/shows?q=' + encodeURIComponent(title)
  };

  request(payload, function (error, response, body) {
    if (error) {
      console.log("[ERROR] no show found for query '%s', response error", title);
      console.log(error);
      return done(error);
    }

    try {
      var shows = JSON.parse(body);
      if (!Array.isArray(shows) || shows.length === 0) {
        console.log("[ERROR] no show found for query '%s', empty list", title);
        return done("unknown serie");
      }
    } catch (e) {
      console.log("[ERROR] no show found for query '%s', parsing error", title);
      console.log(e);
      return done(e);
    }

    for (var i = 0; i < shows.length; ++i) {
      console.log("[CONFIG] Show '%s' with possible id %s, premiered %s ", title, shows[i].show.id, shows[i].show.premiered);
      if (shows.length > 1) {
        console.log(shows[i].show.summary)
      }
      console.log()
    }

    return done("unknown serie, possibilities offered");
  });
}

var getEpisode = function(showId, title, season, episode, done) {
  var SE = formatters.episode(season, episode);
  var payload = {
    url: 'http://api.tvmaze.com/shows/' + showId + '/episodebynumber?season=' + season + '&number=' + episode
  };

  request(payload, function (error, response, body) {
    if (error) {
      console.log("[ERROR] no show found for query '%s %s', response error", title, SE);
      console.log(error);
      return done(error);
    }

    try {
      var show = JSON.parse(body);
    } catch (e) {
      console.log("[ERROR] no episode found for query '%s %s', parsing error", showId, SE);
      console.log(e);
      return done("unknown episode");
    }

    if (!show.id) {
      debug("episode wasn't found for query '%s %s'", title, SE);
      return done(null, false);
    } else if (moment(show.airstamp).isAfter(moment())) {
      debug("episode not yet aired for query '%s %s'", title, SE);
      return done(null, false);
    } else {
      debug("episode found for query '%s %s' -> '%s %s'", title, SE, show.name, show.number);
      return done(null, true);
    }
  });
}

module.exports = function(title, season, episode, options, config, done) {
  if (!config.map[title]) {
    console.log("[CONFIG] No serie id found for '%s'", title);
    if (!options.discover) {
      return done("unknown serie");
    }
    return getPossibleShows(title, done);
  }

  var showId = config.map[title];
  getEpisode(showId, title, season, episode, done);
}
