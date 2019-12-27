"use strict";

var async = require("async");
var request = require("request");
var moment = require("moment");
var inquirer = require("inquirer");

var enterSeries = function(showName, list, done) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "show",
        message: "Which show " + showName + " is it?",
        choices: list
      }
    ])
    .then(function(answers) {
      done(null, answers.show);
    }, done);
};

var getPossibleShows = function(program, showName, done) {
  var payload = {
    url: "http://api.tvmaze.com/search/shows?q=" + encodeURIComponent(showName)
  };

  program.log.debug("[external call] search %s", showName);
  request(payload, function(e, response, body) {
    var results;

    if (e) {
      program.log.error(
        "no show found for query %s, response error",
        showName,
        e
      );
      return done(e);
    }

    try {
      results = JSON.parse(body);
      if (!Array.isArray(results) || results.length === 0) {
        program.log.error("no show found for query %s, empty list", showName);
        return done("unknown serie");
      }
    } catch (e) {
      program.log.error(
        "no show found for query %s, parsing error",
        showName,
        e
      );
      return done(e);
    }

    var list = results.map(function(result, i) {
      return {
        name:
          result.show.name +
          ", " +
          result.show.premiered +
          ", " +
          result.show.url,
        value: i
      };
    });

    enterSeries(showName, list, function(e, option) {
      if (e) {
        return done(e);
      }

      var show = results[option].show;
      program.config.set("series:" + showName + ":info", {
        name: show.name,
        ids: {
          tvmaze: show.id,
          tvrage: show.externals.tvrage,
          thetvdb: show.externals.thetvdb
        }
      });
      done(null, show.id);
    });
  });
};

var getShow = function(program, showName, showId, done) {
  var payload = {
    url: "http://api.tvmaze.com/shows/" + showId + "?embed=episodes"
  };

  program.log.debug("[external call] lookup %s (%s)", showId, showName);
  request(payload, function(e, response, body) {
    if (e) {
      program.log.error(
        "no show found for id %s (%s), response error",
        showId,
        showName,
        e
      );
      return done(e);
    }

    try {
      var show = JSON.parse(body);
      return done(null, show);
    } catch (e) {
      program.log.error(
        "no show found for id %s (%s), parsing error",
        showId,
        showName,
        e
      );
      return done(e);
    }
  });
};

module.exports = function(program, showName, options, done) {
  async.waterfall(
    [
      function(next) {
        var showId = program.config.get(
          "series:" + showName + ":info:ids:tvmaze"
        );
        if (showId) {
          return next(null, showId);
        }

        program.log.warn("no serieId found for '%s'", showName);
        if (!options.discover) {
          return next("unknown serie");
        }

        getPossibleShows(program, showName, next);
      },
      function(showId, next) {
        var show = program.config.get("series:" + showName);
        program.config.set("series:" + showName + ":accessed", moment());

        var noNeedForUpdate =
          moment(show.updated)
            .add("1 day")
            .isBefore(moment()) || show.info.status === "Ended";
        if (options.cache && noNeedForUpdate) {
          return next(null, show.episodes);
        }

        getShow(program, showName, showId, function(e, show) {
          if (e) {
            return next(e);
          }

          program.config.set("series:" + showName + ":updated", moment());
          program.config.set(
            "series:" + showName + ":info:status",
            show.status
          );

          program.log.debug(
            "found %s episodes for %s (%s)",
            show._embedded.episodes.length,
            showId,
            showName
          );
          var episodes = show._embedded.episodes.map(function(episode) {
            return {
              season: episode.season,
              episode: episode.number,
              airstamp: episode.airstamp
            };
          });
          program.config.set("series:" + showName + ":episodes", episodes);

          next(null, episodes);
        });
      }
    ],
    done
  );
};
