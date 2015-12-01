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
      syno.dl.createTask(params, function (err, res) {
        if (err && err.code === 100) {
          console.log('[ERROR] 100 from synology for %s', params);
        }
        done(err, res);
      });
    }
  }
};
