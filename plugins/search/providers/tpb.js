// Disabled: Requires code update

var bytes = require('bytes')
var tpb = require('thepiratebay')

module.exports = (program, query, done) => {
  program.log.debug('tpb: searching for %s', query)

  tpb
    .search(query, {
      category: '205,208',
      orderBy: 'seeds',
      sortBy: 'desc',
    })
    .then(
      results => {
        var torrents = results || []
        program.log.debug(
          'tpb: found %s torrents for %s',
          torrents.length,
          query
        )

        done(
          null,
          torrents.map(torrent => {
            return {
              title: torrent.name,
              size: Number(bytes(torrent.size.replace(/[i\s]/g, ''))),
              torrentLink: torrent.magnetLink,
              seeders: Number(torrent.seeders),
              leechers: Number(torrent.leechers),
              source: 'tpb',
            }
          })
        )
      },
      e => {
        program.log.error('tpb', e)
        done(null, [])
      }
    )
}
