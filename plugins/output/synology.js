const Syno = require('syno')

module.exports = function(program, pluginConfig) {
  const syno = new Syno(pluginConfig.options)

  return {
    download: async function(episode) {
      const params = {
        uri: episode.torrent.torrentLink,
        destination: pluginConfig.dest(episode),
      }

      program.log.debug('synology: added to queue', params)
      return new Promise((resolve, reject) => {
        syno.dl.createTask(params, function(e, res) {
          if (e && e.code === 100) {
            program.log.error("remote directory doesn't exist", params, e)
          }
          return e ? reject(e) : resolve(res)
        })
      })
    },
  }
}
