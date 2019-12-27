"use strict";

var _ = require("lodash");
var request = require("request");
var url = require("url");
var moment = require("moment");
var async = require("async");

var RARBG_DELAY = 3000; // rarbg's rate limit 1req/2sec

var query = function(options, next) {
  _.defaults(options, {
    timeout: 10000,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"
    }
  });
  request(options, function(e, res, body) {
    if (e) {
      return next(e);
    }

    if (res.statusCode !== 200) {
      return next("[" + res.statusCode + "] " + res.statusMessage);
    }

    try {
      var json = JSON.parse(body);
      return next(null, json);
    } catch (e) {
      return next(e);
    }
  });
};

var getToken = function(appName, next) {
  var uri = url.format({
    protocol: "https",
    host: "torrentapi.org",
    pathname: "pubapi_v2.php",
    query: {
      get_token: "get_token", // eslint-disable-line camelcase
      app_id: appName // eslint-disable-line camelcase
    }
  });

  query(
    {
      url: uri
    },
    function(e, data) {
      if (e) {
        return next(e);
      }

      return next(null, data.token);
    }
  );
};

var ensureToken = function(program, next) {
  var token = program.config.get("rarbg:token");
  if (!token || moment().isAfter(token.expires)) {
    return getToken(program._name, function(e, token) {
      if (e) {
        return next(e);
      }

      program.config.set("rarbg:token", {
        access_token: token, // eslint-disable-line camelcase
        expires: Number(moment().add("15 minutes"))
      });

      setTimeout(function() {
        return next(null, token);
      }, RARBG_DELAY);
    });
  }

  return next(null, token.access_token);
};

var searchFactory = function(program) {
  return function(options, next) {
    ensureToken(program, function(e, token) {
      if (e) {
        return next(e);
      }

      _.defaults(options, {
        mode: "search",
        format: "json_extended",
        token: token,
        app_id: program._name // eslint-disable-line camelcase
      });

      var uri = url.format({
        protocol: "https",
        host: "torrentapi.org",
        pathname: "pubapi_v2.php",
        query: options
      });

      query(
        {
          url: uri
        },
        function(e, data) {
          if (e) {
            return next(e);
          }

          if (data.error_code === 20) {
            // No results found
            return next(null, []);
          }

          if (data.error) {
            return next("[" + data.error_code + "] " + data.error);
          }

          return next(null, data.torrent_results);
        }
      );
    });
  };
};

var queue = null;

module.exports = function(program) {
  var search = searchFactory(program);

  if (!queue) {
    queue = async.queue(function(task, next) {
      search(task.options, function(e, results) {
        setTimeout(function() {
          return next(e, results);
        }, RARBG_DELAY);
      });
    }, 1);
  }

  return {
    search: function(options, next) {
      queue.push({ options: options }, next);
    }
  };
};
