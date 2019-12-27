var humanize = require('humanize');

module.exports = {
  episode: function (season, episode) {
    return 'S' + (season || 0).toString().padStart(2, '0') + 'E' + (episode || 0).toString().padStart(2, '0');
  },
  filesize: function (size) {
    return humanize.filesize(size);
  }
};
