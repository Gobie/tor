var pad = require('pad');
var humanize = require('humanize');

module.exports = {
  episode: function (season, episode) {
    return 'S' + pad(2, season, '0') + 'E' + pad(2, episode, '0');
  },
  filesize: function (size) {
    return humanize.filesize(size);
  }
};
