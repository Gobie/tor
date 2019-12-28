const { find, groupBy } = require('lodash')
const moment = require('moment')
const lookup = require('../lib/lookup')
const formatters = require('../lib/formatters')
const UnknownSeriesError = require('../lib/unknown-series-error')

/*
  Input episode structure
  {
    name: 'Archer.2009',
    path: 'Archer',
    season: 3,
    episode: 4,
    source: 'file/trakt/options',
    extension: '.avi', // optional from 'file' source
    originalFilename: 'Archer.2009.S03E04.WhiteElephant.avi' // optional from 'file' source
  }
*/

/*
  Output episode structure
  {
    name: 'Archer',
    season: 3,
    episode: 4,
  }
*/

module.exports = async (program, episodes, options) => {
  const showsGroupedByName = groupBy(episodes, 'path')
  const showNames = Object.keys(showsGroupedByName)
  program.log.debug('processing shows', showNames)

  const allMissingEpisodes = []
  for (let showName of showNames) {
    const missingEpisodes = []
    try {
      const episodes = await lookup(program, program.config, showName, options)
      for (let episode of episodes) {
        const SE = formatters.episode(episode.season, episode.episode)

        if (!episode.airstamp || moment(episode.airstamp).isAfter(moment())) {
          program.log.debug('not yet aired %s %s', showName, SE)
        } else if (
          !find(showsGroupedByName[showName], {
            season: episode.season,
            episode: episode.episode,
          })
        ) {
          program.log.info('missing %s %s', showName, SE)
          missingEpisodes.push({
            name: showName,
            season: episode.season,
            episode: episode.episode,
          })
        }
      }
    } catch (e) {
      if (e instanceof UnknownSeriesError) {
        continue
      }

      throw e
    }

    program.log.debug(
      '%s (%s missing)',
      showName,
      missingEpisodes.length || 'no'
    )
    allMissingEpisodes.push(...missingEpisodes)
  }

  return allMissingEpisodes
}
