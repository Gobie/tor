const _ = require('lodash')

/**
 * @param {Array<{type, args}>} filterConfig values from config
 */
module.exports = (program, filterTypes, filterConfig) => {
  const data = []

  // create deferred filter chain
  const filterChain = filterConfig.reduce((acc, { type, args }) => {
    const filterFactory = filterTypes[type]
    if (!filterFactory) {
      program.log.error('unknown filter type', type)
      return acc
    }
    // create filter with args from config
    const filter = filterFactory.apply(null, args)
    // add filter to deferred chain
    return acc.filter(filter)
  }, _(data))

  return torrents => {
    // change source data for filter
    data.length = 0
    data.push.apply(data, torrents)
    // evaluate chain
    return filterChain.value()
  }
}
