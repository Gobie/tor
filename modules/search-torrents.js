'use strict';

var async = require('async');
var formatters = require('../lib/formatters');
var search = require('../plugins/search/search');
var filtersFactory = require('../plugins/search/filters');

module.exports = function (program, episodes, config, done) {
  var filter = filtersFactory(program, config.search.filters);

  async.mapLimit(episodes, 5, function (episode, next) {
    var query = episode.name + ' ' + formatters.episode(episode.season, episode.episode);
    program.log.debug('searching for %s', query);
    search(program, query, function (e, torrents) {
      if (e || !torrents.length) {
        program.log.info('episode %s wasn\'t found on torrent sites', query);
        return next();
      }
      program.log.debug('%s torrents found for %s', torrents.length, query);

      var acceptedTorrents = filter(torrents);
      program.log.debug('%s out of %s torrents remained for %s', acceptedTorrents.length, torrents.length, query);

      if (!acceptedTorrents.length) {
        program.log.info('episode %s wasn\'t found because of filters', query);
        return next();
      }
      program.log.info('episode %s was found', query);

      return next(null, {episode: episode, torrent: acceptedTorrents[0]});
    });
  }, function (e, res) {
    done(e, (res || []).filter(Boolean));
  });
};
