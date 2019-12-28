const formatters = require('../../lib/formatters')

module.exports = program => {
  return {
    minSize: minSize => {
      return torrent => {
        if (torrent.size < minSize) {
          program.log.debug(
            '%s skipped, size %s < %s',
            torrent.title,
            formatters.filesize(torrent.size),
            formatters.filesize(minSize)
          )
          return false
        }
        return true
      }
    },
    maxSize: maxSize => {
      return torrent => {
        if (torrent.size > maxSize) {
          program.log.debug(
            '%s skipped, size %s > %s',
            torrent.title,
            formatters.filesize(torrent.size),
            formatters.filesize(maxSize)
          )
          return false
        }
        return true
      }
    },
    regex: regex => {
      return torrent => {
        if (regex.test(torrent.title)) {
          program.log.debug('%s skipped, blocked phrases', torrent.title)
          return false
        }
        return true
      }
    },
    seeders: minSeeders => {
      return torrent => {
        if (torrent.seeders < minSeeders) {
          program.log.debug(
            '%s skipped, seeders %s < %s',
            torrent.title,
            torrent.seeders,
            minSeeders
          )
          return false
        }
        return true
      }
    },
  }
}
