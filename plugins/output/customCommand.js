'use strict';

var exec = require('child_process').exec;

module.exports = function (program, pluginConfig) {
  return {
    exec: function(episode, done) {
      var command = pluginConfig.cmd(episode);
      program.log.debug('execute command', command);
      exec(command, function (error, stdout, stderr) {
        if (error || stderr) return done(error || stderr);
        done();
      });
    }
  }
};
