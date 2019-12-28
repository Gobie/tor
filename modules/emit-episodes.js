const {flattenDeep} = require('lodash')

/*
  Output episode structure
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

module.exports = async function(program, config, options) {
  const filesystem = require('../plugins/emit/filesystem')(program, config)
  const trakt = require('../plugins/emit/trakt')(
    program,
    program.config,
    config
  )

  const episodes = await Promise.all([
    options.filesystem ? filesystem() : [],
    options.addSeries.map(function(series) {
      return {
        name: series,
        path: series,
        season: 0,
        episode: 0,
        source: 'options',
      }
    }),
    options.trakt ? trakt.getWatchlist() : [],
    options.trakt ? trakt.getCollection() : [],
  ])

  // TODO deduplicate episodes by name/season/episode
  return flattenDeep(episodes).map(function(episode) {
    // path is used as cache key, keys are namespaced by :
    episode.path = episode.path.replace(/:/, '')
    return episode
  })
}
