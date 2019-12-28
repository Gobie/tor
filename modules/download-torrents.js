const traktFactory = require('../plugins/output/trakt')
const synologyFactory = require('../plugins/output/synology')
const customCommandFactory = require('../plugins/output/custom-command')

/*
  Input episode structure
  {
    episode: {
      name: 'Archer',
      season: 3,
      episode: 4,
    },
    torrent: {
      ...
    }
  }
*/

module.exports = async function(program, config, episodes, options) {
  const trakt = traktFactory(program, program.config, config)
  const synology = synologyFactory(program, config.output.synology)
  const customCommand = customCommandFactory(
    program,
    config.output.customCommand
  )

  let numTorrents = 0
  for (let episode of episodes) {
    program.log.info(
      'downloading %s [%s, %s]',
      episode.torrent.title,
      episode.torrent.seeders + '/' + episode.torrent.leechers,
      episode.torrent.source
    )

    if (options.dryRun) continue
    numTorrents++

    await customCommand.exec(episode)
    await synology.download(episode)

    if (!options.trakt) continue
    await Promise.all([
      trakt.addToCollection(episode),
      trakt.removeFromWatchlist(episode),
    ])
  }

  return numTorrents
}
