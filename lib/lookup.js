'use strict';

var debug = require('debug')('lib:lookup');
var async = require('async');
var request = require('request');
var moment = require('moment');
var formatters = require('./formatters');

var enterSeries = function(max, done) {
  var schema = {
    properties: {
      option: {
        conform: function(value) {
          return 0 < value && value <= max;
        },
        message: 'Choose one of the options',
        required: true
      }
    }
  };

  var prompt = require('prompt');
  prompt.start();
  prompt.get(schema, function (err, result) {
    if (err) return done(err);
    done(null, result.option);
  });
}

var getPossibleShows = function(title, cache, done) {
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
      var results = JSON.parse(body);
      if (!Array.isArray(results) || results.length === 0) {
        console.log("[ERROR] no show found for query '%s', empty list", title);
        return done("unknown serie");
      }
    } catch (e) {
      console.log("[ERROR] no show found for query '%s', parsing error", title);
      console.log(e);
      return done(e);
    }

    console.log("Discovering %s", title);
    for (var i = 0; i < results.length; ++i) {
      console.log("%s) %s premiered on %s, %s", i+1, results[i].show.name, results[i].show.premiered, results[i].show.url);
    }

    enterSeries(results.length, function (err, option) {
      if (err) return done("unknown serie, possibilities offered");
      var show = results[option - 1].show;
      cache.set('series:' + title + ':info', {
        name: show.name,
        ids: {
          tvmaze: show.id,
          tvrage: show.externals.tvrage,
          thetvdb: show.externals.thetvdb
        },
        status: show.status
      });
      done(null, show.id);
    })
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
    } else if (!show.airstamp || moment(show.airstamp).isAfter(moment())) {
      debug("episode not yet aired for query '%s %s'", title, SE);
      return done(null, false);
    } else {
      debug("episode found for query '%s %s' -> '%s %s'", title, SE, show.name, show.number);
      return done(null, true);
    }
  });
}

module.exports = function(title, season, episode, options, cache, done) {
  async.waterfall([
    function (next) {
      var showId = cache.get('series:' + title + ':info:ids:tvmaze');
      if (showId) {
        return next(null, showId);
      }
      console.log("[CONFIG] No serie id found for '%s'", title);
      if (!options.discover) {
        return next("unknown serie");
      }
      getPossibleShows(title, cache, next);
    },
    function (showId, next) {
      getEpisode(showId, title, season, episode, next);
    }
  ], done);
}
