const path = require('path')
const torrentParser = require('./torrent-parser')
const customCommand = require('./custom-command')

// TODO extract to input filters
const allowedExt = ['.avi', '.mp4', '.mpg', '.mkv']
const regex = /(Extras|Specials|Sample|E00)/

module.exports = function(program, config) {
  if (!config.input.customCommand) {
    throw new Error('no input command specified')
  }

  return async function() {
    const filePaths = await customCommand(program, config.input.customCommand)
    program.log.debug('%s files found', filePaths.length)

    const filteredFilePaths = filePaths.filter(filePath => {
      return (
        allowedExt.indexOf(path.extname(filePath)) !== -1 &&
        !regex.test(filePath)
      )
    })
    program.log.debug('%s files after filter', filteredFilePaths.length)

    return await Promise.all(
      filteredFilePaths.map(filePath =>
        torrentParser(program, config, filePath)
      )
    )
  }
}
