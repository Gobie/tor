module.exports = function(program, cache, config) {
  const traktService = require('../../services/trakt')(program, cache, config)

  return {
    getWatchlist: async function() {
      const emitEpisodes = function(entities) {
        return entities.map(function(entity) {
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
    getCollection: async function() {
      const emitEpisodes = function(entities) {
        return entities.map(function(entity) {
          return entity.seasons.map(function(season) {
            return season.episodes.map(function(episode) {
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
