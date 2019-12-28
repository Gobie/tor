const humanize = require('humanize')

module.exports = {
  episode: (season, episode) => {
    const S = (season || 0).toString().padStart(2, '0')
    const E = (episode || 0).toString().padStart(2, '0')
    return `S${S}E${E}`
  },
  filesize: size => {
    return humanize.filesize(size)
  },
}
