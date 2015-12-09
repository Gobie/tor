'use strict';

var Trakt = require('trakt.tv');
var async = require('async');
var open = require('open');

var enterPin = function(done) {
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
    if (e) return done(e);
    done(null, result.pin);
  });
}

module.exports = function (program, pluginConfig) {
  var trakt = new Trakt(pluginConfig);

  return {
    addToCollection: function(episode, cache, done) {
      async.series([
        // authenticate
        function (next) {
          if (cache.get('trakt:token')) return next();

          program.log.info('trakt: authorize on %s', trakt.get_url());
          open(trakt.get_url());
          enterPin(function (e, pin) {
            if (e) return next(e);
            trakt.exchange_code(pin)
            .then(function (result) {
              cache.set('trakt:token', trakt.export_token());
              next();
            }, next)
          });
        },
        // add to collection
        function (next) {
          var data = {
            shows: [{
              ids: {tvdb: cache.get('series:' + episode.episode.name + ':info:ids:thetvdb')},
              seasons: [{
                number: episode.episode.season,
                episodes: [{number: episode.episode.episode}]
              }]
            }]
          };

          // TODO refresh_token
          trakt
          .import_token(cache.get('trakt:token'))
          .then(function() {
            return trakt.sync.collection.add(data);
          })
          .then(function(res) {
            if (res.added.episodes != 1 && res.existing.episodes != 1) {
              program.log.error('trakt: saving episode failed', data, res);
            }
            next();
          }, next);
        }
      ], done);
    }
  }
};
