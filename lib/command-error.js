class CommandError extends Error {
  constructor(command, e) {
    super(`${command} => ${e.toString()}`)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CommandError)
    }

    this.name = 'CommandError'
  }
}

module.exports = CommandError
