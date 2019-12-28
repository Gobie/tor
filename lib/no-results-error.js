class NoResultsError extends Error {
  constructor() {
    super()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoResultsError)
    }

    this.name = 'NoResultsError'
  }
}

module.exports = NoResultsError
