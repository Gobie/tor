'use strict';

var exec = require('child_process').exec;

module.exports = function (program, pluginConfig) {
  return {
    exec: function(episode, done) {
      var command = pluginConfig.cmd(episode);
      program.log.debug('execute command', command);
      exec(command, function (e, stdout, stderr) {
        if (e || stderr) return done(e || stderr);
        done();
      });
    }
  }
};
