const request = require('request-promise-native')
const moment = require('moment')
const inquirer = require('inquirer')
const UnknownSeriesError = require('./unknown-series-error')

const updateMinDate = moment().subtract(1, 'days')

const enterSeries = async function(showName, list) {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'show',
      message: `Which show "${showName}" is?`,
      choices: list,
    },
  ])

  return answers.show
}

const discoverShow = async function(program, showName) {
  let body
  try {
    program.log.debug('[external call] search %s', showName)
    const payload = {
      url:
        'http://api.tvmaze.com/search/shows?q=' + encodeURIComponent(showName),
    }
    body = await request(payload)
  } catch (e) {
    program.log.error('no show found for query %s, response error', showName, e)
    throw e
  }

  let results
  try {
    results = JSON.parse(body)
    if (!Array.isArray(results) || results.length === 0) {
      program.log.error('no show found for query %s, empty list', showName)
      throw new UnknownSeriesError()
    }
  } catch (e) {
    program.log.error('no show found for query %s, parsing error', showName, e)
    throw e
  }

  const list = results.map(function({ show: { name, premiered, url } }, i) {
    return {
      name: `${name}, ${premiered}, ${url}`,
      value: i,
    }
  })
  const option = await enterSeries(showName, list)
  return results[option].show
}

const getShow = async function(program, showName, showId) {
  let body
  try {
    program.log.debug('[external call] lookup %s (%s)', showId, showName)
    const payload = {
      url: 'http://api.tvmaze.com/shows/' + showId + '?embed=episodes',
    }
    body = await request(payload)
  } catch (e) {
    program.log.error(
      'no show found for ID %s (%s), response error',
      showId,
      showName,
      e
    )
    throw e
  }

  try {
    return JSON.parse(body)
  } catch (e) {
    program.log.error(
      'no show found for ID %s (%s), parsing error',
      showId,
      showName,
      e
    )
    throw e
  }
}

module.exports = async function(program, cache, showName, options) {
  const cacheKey = `series:${showName}`
  let showId = cache.get(`${cacheKey}:info:ids:tvmaze`)

  if (!showId) {
    program.log.warn("no show ID found for '%s'", showName)
    if (!options.discover) {
      throw new UnknownSeriesError()
    }

    const remoteShow = await discoverShow(program, showName)
    cache.set(`${cacheKey}:info`, {
      name: remoteShow.name,
      ids: {
        tvmaze: remoteShow.id,
        tvrage: remoteShow.externals.tvrage,
        thetvdb: remoteShow.externals.thetvdb,
      },
    })

    showId = remoteShow.id
  }

  const show = cache.get(cacheKey)
  cache.set(`${cacheKey}:accessed`, moment())

  const noNeedForUpdate =
    moment(show.updated).isBefore(updateMinDate) || show.info.status === 'Ended'
  if (options.cache && noNeedForUpdate) {
    return show.episodes
  }

  const remoteShow = await getShow(program, showName, showId)
  program.log.debug(
    'found %s episodes for %s (%s)',
    remoteShow._embedded.episodes.length,
    showId,
    showName
  )
  const episodes = remoteShow._embedded.episodes.map(function({
    season,
    number,
    airstamp,
  }) {
    return { season, episode, airstamp }
  })
  cache.set(`${cacheKey}:episodes`, episodes)
  cache.set(`${cacheKey}:info:status`, remoteShow.status)
  cache.set(`${cacheKey}:updated`, moment())

  return episodes
}
