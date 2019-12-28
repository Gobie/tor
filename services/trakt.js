const Trakt = require('trakt.tv')
const open = require('open')
const inquirer = require('inquirer')
const DataLoader = require('dataloader')

const enterPin = async function() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'pin',
      message: 'Enter PIN from trakt.tv',
      validate: function(value) {
        const pass = value.match(/^[0-9A-Z]+$/)
        if (pass) {
          return true
        }

        return 'Please enter a valid PIN'
      },
    },
  ])

  return answers.pin
}

module.exports = function(program, cache, config) {
  const trakt = new Trakt(config.services.trakt)
  const tokenKey = 'trakt:token'

  const auth = async function() {
    const token = cache.get(tokenKey)
    if (token) {
      // authenticated
      const refreshedToken = await trakt.import_token(token)
      cache.set(tokenKey, refreshedToken)
    } else {
      // authenticate
      const authUrl = trakt.get_url()
      program.log.info('trakt: authorize on %s', authUrl)
      await open(authUrl)
      const pin = await enterPin()
      await trakt.exchange_code(pin)
      cache.set(tokenKey, trakt.export_token())
    }
  }

  const authDataLoader = new DataLoader(keys => {
    return Promise.all(keys.map(key => auth()))
  })

  return {
    getWatchlist: async function() {
      await authDataLoader.load('')
      return trakt.sync.watchlist.get({ type: 'shows' })
    },
    getCollection: async function() {
      await authDataLoader.load('')
      return trakt.sync.collection.get({ type: 'shows' })
    },
    addToCollection: async function(shows) {
      await authDataLoader.load('')
      return trakt.sync.collection.add(shows)
    },
    removeFromWatchlist: async function(shows) {
      await authDataLoader.load('')
      return trakt.sync.watchlist.remove(shows)
    },
  }
}
