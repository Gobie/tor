const NoResultsError = require('../../../lib/no-results-error')

module.exports = program => {
  const rarbgService = require('../../../services/rarbg')(
    program,
    program.config
  )

  return async query => {
    try {
      program.log.debug('rarbg: searching for %s', query)
      const torrents = await rarbgService.search({
        search_string: query,
        sort: 'seeders',
        category: 'tv',
      })
      program.log.debug(
        'rarbg: found %s torrents for %s',
        torrents.length,
        query
      )

      return torrents.map(torrent => {
        return {
          title: torrent.title,
          size: Number(torrent.size),
          torrentLink: torrent.download,
          seeders: Number(torrent.seeders),
          leechers: Number(torrent.leechers),
          source: 'rarbg',
        }
      })
    } catch (e) {
      if (!(e instanceof NoResultsError)) {
        program.log.error('rarbg', e.stack)
      }
      return []
    }
  }
}
