module.exports = function(program, cache, config) {
  const traktService = require('../../services/trakt')(program, cache, config)

  return {
    addToCollection: async function(episode) {
      const shows = {
        shows: [
          {
            ids: {
              tvdb: cache.get(
                'series:' + episode.episode.name + ':info:ids:thetvdb'
              ),
            },
            seasons: [
              {
                number: episode.episode.season,
                episodes: [{ number: episode.episode.episode }],
              },
            ],
          },
        ],
      }

      try {
        program.log.debug('trakt: added to collection', shows)
        const res = await traktService.addToCollection(shows)
        if (res.added.episodes !== 1 && res.existing.episodes !== 1) {
          program.log.error(
            'trakt: saving episode had unexpected output',
            JSON.stringify(shows),
            JSON.stringify(res)
          )
        }
      } catch (e) {
        program.log.error('trakt: saving episode had error output', shows, e)
      }
    },
    removeFromWatchlist: function(episode) {
      program.log.debug('trakt: removed from watchlist', episode)
      traktService.removeFromWatchlist({
        shows: [
          {
            ids: {
              tvdb: cache.get(
                'series:' + episode.episode.name + ':info:ids:thetvdb'
              ),
            },
          },
        ],
      })
    },
  }
}
