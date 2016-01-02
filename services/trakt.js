'use strict';

var Trakt = require('trakt.tv');
var async = require('async');
var open = require('open');

var enterPin = function (done) {
  var schema = {
    properties: {
      pin: {
        pattern: /^[0-9A-Z]+$/,
        message: 'PIN must be only numbers or letters',
        description: 'Enter PIN from trakt.tv',
        required: true
      }
    }
  };

  var prompt = require('prompt');
  prompt.start();
  prompt.get(schema, function (e, result) {
    if (e) {
      return done(e);
    }

    done(null, result.pin);
  });
};

module.exports = function (program, pluginConfig, cache) {
  var trakt = new Trakt(pluginConfig);

  return {
    authAction: function (action, done) {
      async.series([
        // authenticate
        function (next) {
          if (cache.get('trakt:token')) {
            return next();
          }

          program.log.info('trakt: authorize on %s', trakt.get_url());
          open(trakt.get_url());
          enterPin(function (e, pin) {
            if (e) {
              return next(e);
            }

            trakt.exchange_code(pin)
            .then(function () {
              cache.set('trakt:token', trakt.export_token());
              next();
            }, next);
          });
        },
        // authenticated
        function (next) {
          trakt
          .import_token(cache.get('trakt:token'))
          .then(function (token) {
            // refresh token
            cache.set('trakt:token', token);
            next();
          }, next);
        }
      ], function (e) {
        if (e) {
          return done(e);
        }

        try {
          action(trakt, done);
        } catch (e) {
          done(e.stack || e);
        }
      });
    }
  };
};
