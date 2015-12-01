'use strict';

var PushBullet = require('pushbullet');
var formatters = require('../../lib/formatters');

module.exports = function(program, pluginConfig) {
  var pusher = new PushBullet(pluginConfig.apiKey);

  return {
    push: function(episode, done) {
      var title = 'TOR: ' + episode.episode.name + ' ' + formatters.episode(episode.episode.season, episode.episode.episode);
      var body = '';
      program.log.debug('pushbullet: push', title);
      pusher.note(pluginConfig.device, title, body, done);
    }
  }
};
