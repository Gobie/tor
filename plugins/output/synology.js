const fs = require('fs')
const Syno = require('syno')
const cloudscraper = require('cloudscraper')
const customCommandFactory = require('../../lib/custom-command')

module.exports = (program, pluginConfig) => {
  const customCommand = customCommandFactory(
    program,
    pluginConfig.customCommand
  )
  const syno = new Syno(pluginConfig.options)

  const downloadTorrent = async url => {
    const fileName = url.replace(/[^a-z0-9_-]/gi, '_') + '.torrent'
    const filePath = `/tmp/${fileName}`

    const torrentFile = await cloudscraper.get({ uri: url, encoding: null })
    fs.writeFileSync(filePath, torrentFile)

    return { fileName, filePath }
  }

  const isCloudflareProtected = url => {
    return /\bitorrents\.org\b/.test(url)
  }

  return {
    download: async episode => {
      const params = {
        uri: episode.torrent.torrentLink,
        destination: pluginConfig.dest(episode),
      }

      if (isCloudflareProtected(params.uri)) {
        program.log.debug('synology: downloading torrent file "%s"', params.uri)
        const { fileName, filePath } = await downloadTorrent(params.uri)

        const newFilePath = pluginConfig.torrentDest(fileName)
        program.log.debug(
          'synology: copying torrent file "%s" to "%s"',
          filePath,
          newFilePath
        )
        await customCommand(filePath, newFilePath)

        delete params.uri
        params.local_file = newFilePath
      }

      program.log.debug('synology: adding to download queue', params)
      return new Promise((resolve, reject) => {
        syno.dl.createTask(params, (e, res) => {
          if (e && e.code === 100) {
            program.log.error(
              "synology: remote directory doesn't exist",
              params,
              e
            )
          }
          return e ? reject(e) : resolve(res)
        })
      })
    },
  }
}
