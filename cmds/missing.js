const path = require('path')
const moment = require('moment')
const emitEpisodes = require('../modules/emit-episodes')
const findMissingEpisodes = require('../modules/find-missing')
const searchTorrentsModuleFactory = require('../modules/search-torrents')
const downloadTorrents = require('../modules/download-torrents')

module.exports = function(program) {
  const addSeriesCollector = function(val, memo) {
    memo.push(val)
    return memo
  }

  program
    .command('missing')
    .option('-n, --dry-run', 'Dry run', false)
    .option('--discover', 'Discover new series', false)
    .option('--no-cache', 'Disable episode cache')
    .option('--no-trakt', 'Disable trakt.tv as source')
    .option('--no-filesystem', 'Disable filesystem as source')
    .option('--add-series <value>', 'Add series', addSeriesCollector, [])
    .description('download all missing episodes')
    .action(async function(options) {
      try {
        const config = require(path.join(
          process.env.WORKING_DIRECTORY,
          'config.js'
        ))

        let episodes = await emitEpisodes(program, config, options)
        program.log.info('[stats] emitted %s episodes', episodes.length)

        episodes = await findMissingEpisodes(program, episodes, options)
        program.log.info('[stats] missing %s episodes', episodes.length)

        episodes = await searchTorrentsModuleFactory(program, config)(episodes)
        program.log.info(
          '[stats] found %s episodes on torrent sites',
          episodes.length
        )

        const numTorrents = await downloadTorrents(
          program,
          config,
          episodes,
          options
        )
        program.log.info('[stats] downloaded %d torrents', numTorrents)
      } catch (e) {
        program.log.error(e.stack)
        console.log(e)
      } finally {
        // cleanup: remove series, which were not accessed in last 6 months
        const shows = program.config.get('series')
        for (const showName in shows) {
          if (
            moment()
              .subtract(6, 'months')
              .isAfter(shows[showName].accessed)
          ) {
            delete shows[showName]
          }
        }

        program.config.set('series', shows)
        program.config.save()
      }
    })
}
