const request = require('request-promise-native')
const xml2js = require('xml2js')
const parser = new xml2js.Parser()

const search = async options => {
  const body = await request({ timeout: 10000, ...options })
  return parser.parseStringPromise(body)
}

module.exports = program => {
  return async query => {
    try {
      const uri =
        'https://www.limetorrents.info/searchrss/' +
        encodeURIComponent(query) +
        '/'
      program.log.debug('limetorrents: [external call] search %s', uri)
      const results = await search({ url: uri })

      const torrents = results.rss.channel[0].item || []
      program.log.debug(
        'limetorrents: found %s torrents for %s',
        torrents.length,
        query
      )

      return Promise.all(
        torrents.map(async torrent => {
          return {
            title: torrent.title[0],
            size: Number(torrent.size[0]),
            torrentLink: torrent.enclosure[0].$.url,
            seeders: Number(
              torrent.description[0].replace(/^Seeds\D+(\d+).+$/, '$1')
            ),
            leechers: Number(
              torrent.description[0].replace(/^.+Leechers\D+(\d+)$/, '$1')
            ),
            source: 'limetorrents',
          }
        })
      )
    } catch (e) {
      program.log.error('limetorrents', e.stack)
      return []
    }
  }
}
