'use strict';

var exec = require('child_process').exec;

module.exports = function (program, pluginConfig) {
  return {
    exec: function(done) {
      var command = pluginConfig.cmd;
      program.log.debug('execute command', command);
      exec(command, {maxBuffer: 10*1024*1024}, function (e, stdout, stderr) {
        if (e || stderr) return done({command: command, e: e, stderr: stderr});
        done(null, stdout.split(/\n/));
      });
    }
  }
};
