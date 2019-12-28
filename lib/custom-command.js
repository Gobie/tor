const { exec } = require('child-process-promise')
const CommandError = require('./command-error')

module.exports = (program, pluginConfig) => {
  return async (...args) => {
    const command = pluginConfig.cmd(...args)
    try {
      program.log.debug('execute command', command)
      const { stdout, stderr } = await exec(command, {
        maxBuffer: 10 * 1024 * 1024,
      })
      if (stderr) {
        throw new CommandError(command, stderr)
      }
      return stdout.split(/\n/)
    } catch (e) {
      throw new CommandError(command, e)
    }
  }
}
