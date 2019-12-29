const { uniq, flatten, sortBy } = require('lodash')
const { default: PQueue } = require('p-queue')
const formatters = require('../lib/formatters')
const filtersFactory = require('../lib/filters')
const filterTypesFactory = require('../plugins/search/filter-types')

/*
  Input episode structure
  {
    name: 'Archer',
    season: 3,
    episode: 4,
  }
*/

/*
  Output episode structure
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

module.exports = (program, config) => {
  const queue = new PQueue({ concurrency: config.search.concurrency || 5 })

  const providers = [
    require('../plugins/search/providers/rarbg')(program),
    require('../plugins/search/providers/limetorrents')(program),
    require('../plugins/search/providers/tpb')(program),
  ]

  const search = async query => {
    // No error should ever be thrown here, search providers return [] on error
    const torrents = await Promise.all(
      providers.map(provider => provider(query))
    )

    return sortBy(flatten(torrents), ['seeders']).reverse()
  }

  const applyFilters = filtersFactory(
    program,
    filterTypesFactory(program),
    config.search.filters || []
  )

  const searchForEpisode = async episode => {
    const query = `${episode.name.replace(/[':]/, '')} ${formatters.episode(
      episode.season,
      episode.episode
    )}`

    let queries = [query]
    // TODO extract to config
    queries.push(query.replace(/Marvel'?s\s*/, ''))
    queries = uniq(queries)

    // No error should ever be thrown here, search should return []
    const torrents = flatten(
      await Promise.all(queries.map(async query => search(query)))
    )

    const logQuery = queries.join(' OR ')
    if (!torrents.length) {
      program.log.info("episode %s wasn't found on torrent sites", logQuery)
      return
    }

    const acceptedTorrents = applyFilters(torrents)
    program.log.debug(
      '%s out of %s torrents remained for %s',
      acceptedTorrents.length,
      torrents.length,
      logQuery
    )

    if (!acceptedTorrents.length) {
      program.log.info("episode %s wasn't found because of filters", logQuery)
      return
    }

    program.log.info('episode %s was found', logQuery)
    return { episode, torrent: acceptedTorrents[0] }
  }

  return async episodes => {
    try {
      const results = await Promise.all(
        episodes.map(async episode => {
          return queue.add(async () => searchForEpisode(episode))
        })
      )

      return results.filter(Boolean)
    } catch (e) {
      program.log.error('search queue', e.stack)
      return []
    }
  }
}
