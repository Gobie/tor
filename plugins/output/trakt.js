'use strict';

var debug = require('debug')('plugins:output:trakt');
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
  prompt.get(schema, function (err, result) {
    if (err) return done(err);
    done(null, result.pin);
  });
}

module.exports = function (pluginConfig) {
  var trakt = new Trakt(pluginConfig);

  return {
    addToCollection: function(episode, config, cache, done) {
      async.series([
        // authenticate
        function (next) {
          if (cache.trakt.token) return next();

          debug('authorize on', trakt.get_url());
          open(trakt.get_url());
          enterPin(function (err, pin) {
            if (err) return next(err);
            trakt.exchange_code(pin)
            .then(function (result) {
              cache.trakt.token = trakt.export_token();
              next();
            }, next)
          });
        },
        // add to collection
        function (next) {
          trakt
          .import_token(cache.trakt.token)
          .then(function() {
            var data = {
              shows: [{
                ids: {tvrage: config.map[episode.episode.name]},
                seasons: [{
                  number: episode.episode.season,
                  episodes: [{number: episode.episode.episode}]
                }]
              }]
            };
            return trakt.sync.collection.add(data);
          })
          .then(function(data) {
            if (data.added.episodes != 1 && data.existing.episodes != 1) {
              console.log('[ERROR] saving episode to trakt failed', data);
            }
            next();
          }, next);
        }
      ], done);
    }
  }
};
