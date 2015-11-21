'use strict';

var debug = require('debug')('plugins:output:customCommand');
var exec = require('child_process').exec;

module.exports = function (pluginConfig) {
  return {
    exec: function(episode, done) {
      var command = pluginConfig.cmd(episode);
      debug('execute', command);
      exec(command, function (error, stdout, stderr) {
        if (error || stderr) return done(error || stderr);
        done();
      });
    }
  }
};
