'use strict';

var Syno = require('syno');

module.exports = function (program, pluginConfig) {
  var syno = new Syno(pluginConfig.options);

  return {
    download: function (episode, done) {
      var params = {
        uri: episode.torrent.torrentLink,
        destination: pluginConfig.dest(episode)
      };

      program.log.debug('synology: added to queue', params);
      syno.dl.createTask(params, function (e, res) {
        if (e && e.code === 100) {
          program.log.error('100 error from synology for %s', params, e);
        }
        done(e, res);
      });
    }
  };
};
