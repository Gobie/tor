'use strict';

var formatters = require('../../lib/formatters');

module.exports = function (program) {
  return {
    minSize: function (minSize) {
      return function (torrent) {
        if (torrent.size <= minSize) {
          program.log.debug('%s skipped, size %s < %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(minSize));
          return false;
        }
        return true;
      };
    },
    maxSize: function (maxSize) {
      return function (torrent) {
        if (torrent.size >= maxSize) {
          program.log.debug('%s skipped, size %s > %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(maxSize));
          return false;
        }
        return true;
      };
    },
    regex: function (regex) {
      return function (torrent) {
        if (regex.test(torrent.title)) {
          program.log.debug('%s skipped, blocked phrases', torrent.title);
          return false;
        }
        return true;
      };
    }
  };
};
