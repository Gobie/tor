'use strict';

var Trakt = require('trakt.tv');
var async = require('async');
var open = require('open');
var inquirer = require('inquirer');

var enterPin = function (done) {
  inquirer.prompt([
    {
      type: 'input',
      name: 'pin',
      message: 'Enter PIN from trakt.tv',
      validate: function (value) {
        var pass = value.match(/^[0-9A-Z]+$/);
        if (pass) {
          return true;
        }

        return 'Please enter a valid PIN';
      }
    }
  ]).then(function (answers) {
    done(null, answers.pin);
  }, done);
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

            trakt
            .exchange_code(pin)
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
