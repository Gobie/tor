const bytes = require('bytes')
const tpb = require('thepiratebay')

module.exports = program => {
  return async query => {
    program.log.debug('tpb: searching for %s', query)

    try {
      const results = await tpb.search(query, {
        category: '205,208',
        orderBy: 'seeds',
        sortBy: 'desc',
      })

      const torrents = results || []
      program.log.debug('tpb: found %s torrents for %s', torrents.length, query)

      return torrents.map(torrent => {
        return {
          title: torrent.name,
          size: Number(bytes(torrent.size.replace(/[i\s]/g, ''))),
          torrentLink: torrent.magnetLink,
          seeders: Number(torrent.seeders),
          leechers: Number(torrent.leechers),
          source: 'tpb',
        }
      })
    } catch (e) {
      program.log.error('tpb', e.stack)
      return []
    }
  }
}
