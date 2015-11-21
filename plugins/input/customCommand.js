'use strict';

var debug = require('debug')('plugins:input:customCommand');
var exec = require('child_process').exec;

module.exports = function (pluginConfig) {
  return {
    exec: function(done) {
      var command = pluginConfig.cmd;
      debug('execute', command);
      exec(command, {maxBuffer: 10*1024*1024}, function (error, stdout, stderr) {
        if (error || stderr) return done(error || stderr);
        done(null, stdout.split(/\n/));
      });
    }
  }
};
