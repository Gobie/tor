'use strict';

var debug = require('debug')('plugins:search:filter-types');
var formatters = require('../../lib/formatters')

module.exports = {
  minSize: function (minSize) {
    return function (torrent) {
      if (torrent.size <= minSize) {
        debug('%s skipped, size %s < %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(minSize));
        return false;
      }
      return true;
    }
  },
  maxSize: function (maxSize) {
    return function (torrent) {
      if (torrent.size >= maxSize) {
        debug('%s skipped, size %s > %s', torrent.title, formatters.filesize(torrent.size), formatters.filesize(maxSize));
        return false;
      }
      return true;
    }
  },
  regex: function (regex) {
    return function (torrent) {
      if (regex.test(torrent.title)) {
        debug('%s skipped, blocked phrases', torrent.title);
        return false;
      }
      return true;
    }
  },
};
