'use strict';

var async = require('async');
var _ = require('lodash');
var formatters = require('../lib/formatters');
var search = require('../plugins/search/search');
var filtersFactory = require('../plugins/search/filters');

module.exports = function (program, episodes, config, done) {
  var filter = filtersFactory(program, config.search.filters);

  async.mapLimit(episodes, 5, function (episode, next) {
    var query = episode.name + ' ' + formatters.episode(episode.season, episode.episode);

    var queries = [query];
    // TODO extract to config
    queries.push(query.replace(/Marvel'?s\s*/, ''));
    queries = _.uniq(queries);

    async.map(queries, function (query, next) {
      program.log.debug('searching for %s', query);
      search(program, query, function (e, torrents) {
        if (e || !torrents.length) {
          return next(null, []);
        }

        return next(null, torrents);
      });
    }, function (e, torrentsPerQuery) {
      // No error should ever get here, search should return {}
      if (e) {
        program.log.error('searching torrents', e);
        return next(e);
      }

      var logQuery = queries.join(' OR ');
      var torrents = _.flatten(torrentsPerQuery);
      if (!torrents.length) {
        program.log.info('episode %s wasn\'t found on torrent sites', logQuery);
        return next();
      }

      var acceptedTorrents = filter(torrents);
      program.log.debug('%s out of %s torrents remained for %s', acceptedTorrents.length, torrents.length, logQuery);

      if (!acceptedTorrents.length) {
        program.log.info('episode %s wasn\'t found because of filters', logQuery);
        return next();
      }

      program.log.info('episode %s was found', logQuery);
      return next(null, {episode: episode, torrent: acceptedTorrents[0]});
    });
  }, function (e, res) {
    done(e, (res || []).filter(Boolean));
  });
};
