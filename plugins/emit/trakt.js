module.exports = (program, cache, config) => {
  const traktService = require('../../services/trakt')(program, cache, config)

  return {
    getWatchlist: async () => {
      const emitEpisodes = entities => {
        return entities.map(entity => {
          return {
            name: entity.show.title,
            path: entity.show.title,
            season: 0,
            episode: 0,
            source: 'trakt',
          }
        })
      }

      try {
        const entities = await traktService.getWatchlist()
        return emitEpisodes(entities)
      } catch (e) {
        program.log.error('trakt: failed to get watchlist', e.stack)
        return []
      }
    },
    getCollection: async () => {
      const emitEpisodes = entities => {
        return entities.map(entity => {
          return entity.seasons.map(season => {
            return season.episodes.map(episode => {
              return {
                name: entity.show.title,
                path: entity.show.title,
                season: season.number,
                episode: episode.number,
                source: 'trakt',
              }
            })
          })
        })
      }

      try {
        const entities = await traktService.getCollection()
        return emitEpisodes(entities)
      } catch (e) {
        program.log.error('trakt: failed to get collection', e.stack)
        return []
      }
    },
  }
}
