'use strict';

var path = require('path');
var ptn = require('parse-torrent-name');
var tvinfo = require('tvinfo');
var debug = require('debug')('lib:torrent-parser');

var parseMultiEpisode = function (filename) {
  // the following regex should match:
  //   Community S01E04E5.mp4
  var re = /^(.*?)(\d{1,2})([ex\-])(\d{1,2})([ex\-])(\d{1,2})(.*)$/i;
  var m = filename.match(re);
  if (m === null) return false;
  return [
    m[1] + m[2] + m[3] + m[4] + m[7],
    m[1] + m[2] + m[3] + m[6] + m[7]
  ]
}

module.exports = function (filePath, next) {
  var fileName = path.basename(filePath);
  var episodes = parseMultiEpisode(fileName) || [fileName];
  var shows = []

  for (var i = 0; i < episodes.length; ++i) {
    var show = tvinfo.filename(episodes[i]);
    if (show) {
      var m = filePath.match(/\/([^/]+)\/Season \d+/);
      if (m === null) {
        debug('[CHECK] found weird directory structue', filePath);
        continue;
      }
      show.title = m[1].replace(/\s\(?\d{4}\)?$/, '');
      show.path = m[1];
    }

    if (!show || !show.season || !show.episode) {
      debug('[CHECK] found weird episode', filePath);
      debug('parse retry %s', filePath);
      show = ptn(path.basename(filePath));
    }

    if (!show || !show.season || !show.episode) {
      debug('parse retry with directory %s', filePath);
      show = ptn(path.basename(path.dirname(filePath)));
    }

    if (!show || !show.season || !show.episode) {
      debug('could not parse %s', filePath);
    }

    shows.push(show)
  }

  return next(null, shows);
}
