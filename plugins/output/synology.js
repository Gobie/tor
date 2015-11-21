'use strict';

var debug = require('debug')('plugins:output:synology');
var Syno = require('syno');

module.exports = function (pluginConfig) {
  var syno = new Syno(pluginConfig.options);

  return {
    download: function(episode, done) {
      var params = {
        uri: episode.torrent.torrentLink,
        destination: pluginConfig.dest(episode)
      };

      debug('add to queue', params);
      syno.dl.createTask(params, done);
    }
  }
};
