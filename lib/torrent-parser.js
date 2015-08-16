'use strict';

var path = require('path');
var ptn = require('parse-torrent-name');
var tvinfo = require('tvinfo');
var debug = require('debug')('lib:torrent-parser');

module.exports = function (filePath, next) {
  var show = tvinfo.filename(path.basename(filePath));
  if (show) {
    show.title = show.name;
  }

  if (!show || !show.season || !show.episode) {
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

  return next(null, show);
}
