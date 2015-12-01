'use strict';

var exec = require('child_process').exec;

module.exports = function (program, pluginConfig) {
  return {
    exec: function(done) {
      var command = pluginConfig.cmd;
      program.log.debug('execute command', command);
      exec(command, {maxBuffer: 10*1024*1024}, function (error, stdout, stderr) {
        if (error || stderr) return done(error || stderr);
        done(null, stdout.split(/\n/));
      });
    }
  }
};
