'use strict';

var debug = require('debug')('lib:synology');
var Syno = require('syno');

module.exports = function (options) {
  var syno = new Syno(options);

  return {
    download: function(uri, destination, dryRun, done) {
      var params = {
        uri: uri,
        destination: destination
      };

      debug('add to queue', params);
      if (dryRun) {
        return done();
      }
      syno.dl.createTask(params, done);
    }
  }
};
