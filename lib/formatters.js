const humanize = require('humanize')

module.exports = {
  episode: function(season, episode) {
    const S = (season || 0).toString().padStart(2, '0')
    const E = (episode || 0).toString().padStart(2, '0')
    return `S${S}E${E}`
  },
  filesize: function(size) {
    return humanize.filesize(size)
  },
}
