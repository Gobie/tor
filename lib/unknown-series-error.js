class UnknownSeriesError extends Error {
  constructor() {
    super()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnknownSeriesError)
    }

    this.name = 'UnknownSeriesError'
  }
}

module.exports = UnknownSeriesError
