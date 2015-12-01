'use strict';

var path = require('path');
var ptn = require('parse-torrent-name');
var debug = require('debug')('lib:torrent-parser');

var parseFilename = function(filename, options) {
  var ext = path.extname(filename).toLowerCase(),
  // the following regex should match:
  //   Community S01E04.mp4
  //   Community s01e04.mp4
  //   Community 1x04.mp4
  //   Community 1-04.mp4
  //   Community/S01E04.mp4
  //   Community/s01e04.mp4
  //   Community/1x04.mp4
  //   Community/1-04.mp4
  //   Community/Season 1/Episode 4.mp4
    re = /(.*)\D(\d{1,2})[ex\-](\d{1,2})/i,
    searchResults = filename.match(re),
    show,
    season,
    episode,
    offset,
    episodeObject = {};

  options = options || {};

  offset = options.offset || 0;
  if (searchResults === null) {
    // this regex should match:
    //   Community Season 1 Episode 4.mp4
    // (case insensitive)
    re = /(.*)Season.*?(\d{1,2}).*Episode\D*?(\d{1,2})/i;
    searchResults = filename.match(re);
  }

  if (searchResults === null) {
    // this regex should match:
    //   Community 104.mp4
    re = /(.*)\D(\d)(\d\d)\D/;
    searchResults = filename.match(re);
  }

  if (searchResults === null && options.season) {
    // this regex should match:
    //   Community 04.mp4
    // but only if we've specified a season with season flag
    re = /(.*)\D(\d+)\D/;
    searchResults = filename.match(re);
  }

  if (searchResults === null && options.season && options.show) {
    // this regex should match:
    //   04.mp4
    // but only if we've specified a season and show with flags
    re = /(\d+)\D/;
    searchResults = filename.match(re);
  }

  try {
    show = options.show || searchResults[1];
  } catch (e) {
    return null;
  }
  show = show
      // remove hanging characters
      .replace(/^[\-.\s]+|[\-.\s\/]+$/g, "")
      .trim();

  if (options.episode) {
    episode = options.episode + offset;
    if (searchResults !== null) {
      searchResults.pop();
    }
  } else {
    try {
      episode = Number(searchResults.pop()) + offset;
    } catch (e) {
      return null;
    }
  }

  season = options.season || Number(searchResults.pop());

  return {
    originalFilename: filename,
    name: show,
    season: season,
    episode: episode,
    extension: ext
  };
};

var parseMultiEpisode = function (filename) {
  // the following regex should match:
  //   Community S01E04E5.mp4
  var re = /^(.*?)(\d{1,2})([ex\-])(\d{1,2})-?([ex\-])(\d{1,2})(.*)$/i;
  var m = filename.match(re);
  if (m === null) return false;
  return [
    m[1] + m[2] + m[3] + m[4] + m[7],
    m[1] + m[2] + m[3] + m[6] + m[7]
  ];
};

module.exports = function (filePath, next) {
  var fileName = path.basename(filePath);
  var episodes = parseMultiEpisode(fileName) || [fileName];
  var shows = []

  for (var i = 0; i < episodes.length; ++i) {
    var show = parseFilename(episodes[i]);

    if (!show || !show.season || !show.episode) {
      debug('found weird episode', filePath);
      var baseName = path.basename(filePath);
      debug('retrying to parse %s', baseName);
      show = ptn(baseName);
    }

    if (!show || !show.season || !show.episode) {
      var baseName = path.basename(path.dirname(filePath));
      debug('retrying to parse directory %s', baseName);
      show = ptn(baseName);
    }

    if (!show || !show.season || !show.episode) {
      debug('[CHECK] failed to parse %s', filePath);
      continue;
    }

    if (show) {
      var m = filePath.match(/\/([^/]+)\/Season \d+\//);
      if (m === null) {
        debug('[CHECK] found weird directory structure', filePath);
        continue;
      }
      show.path = m[1];
    }

    shows.push(show)
  }

  return next(null, shows);
}
