const request = require('request-promise-native')
const url = require('url')
const moment = require('moment')
const { default: PQueue } = require('p-queue')
const pRetry = require('p-retry')
const DataLoader = require('dataloader')
const NoResultsError = require('../lib/no-results-error')

const query = async options => {
  return request({
    timeout: 10000,
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    },
    json: true,
    ...options,
  })
}

const getToken = async (program, appName) => {
  const uri = url.format({
    protocol: 'https',
    host: 'torrentapi.org',
    pathname: 'pubapi_v2.php',
    query: {
      get_token: 'get_token',
      app_id: appName,
    },
  })
  const { token } = await queryQueue.add(async () => {
    program.log.debug('rarbg: [external call] get_token %s', uri)
    return query({ url: uri })
  })

  return token
}

const ensureToken = async (program, cache) => {
  const token = cache.get('rarbg:token')
  if (!token || moment.utc(token.expires).isBefore()) {
    const token = await getToken(program, program._name)
    cache.set('rarbg:token', {
      access_token: token,
      expires: Number(moment().add(15, 'minutes')),
    })
    return token
  }

  return token.access_token
}

const search = async (program, ensureTokenDataLoader, options) => {
  const token = await ensureTokenDataLoader.load('')

  const uri = url.format({
    protocol: 'https',
    host: 'torrentapi.org',
    pathname: 'pubapi_v2.php',
    query: {
      mode: 'search',
      format: 'json_extended',
      token: token,
      app_id: program._name,
      ...options,
    },
  })
  const data = await queryQueue.add(async () => {
    program.log.debug('rarbg: [external call] search %s', uri)
    return query({ url: uri })
  })

  if (data.error) {
    // No results found - it can be an intermittent issue
    if (data.error_code === 20) {
      program.log.debug('rarbg: no results found')
      throw new NoResultsError()
    }

    throw new Error('[' + data.error_code + '] ' + data.error)
  }

  return data.torrent_results
}

const queryQueue = new PQueue({
  carryoverConcurrencyCount: true,
  intervalCap: 1,
  interval: 2100, // rarbg's rate limit 1req/2sec
})

module.exports = (program, cache) => {
  const ensureTokenDataLoader = new DataLoader(keys => {
    return Promise.all(keys.map(key => ensureToken(program, cache)))
  })

  return {
    search: async options => {
      return pRetry(() => search(program, ensureTokenDataLoader, options), {
        retries: 2,
      })
    },
  }
}
