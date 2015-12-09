'use strict';

var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var search = function(options, callback) {
  var req = request(options);
  req.on('response', function(res) {
    var chunks = [];
    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function() {
      try {
        parser.parseString(Buffer.concat(chunks).toString(), callback);
      } catch (e) {
        callback(e);
      }
    });
  });
  req.on('error', callback);
}

module.exports = function (program, query, done) {
  program.log.debug('limetorrents: searching for %s', query);

  search({
    url: 'https://www.limetorrents.cc/searchrss/' + encodeURIComponent(query) + '/'
  }, function (e, results) {
    if (e) {
      program.log.error('limetorrents', e);
      return done(null, []);
    }

    var torrents = results.rss.channel[0].item || [];
    program.log.debug('limetorrents: found %s torrents for %s', torrents.length, query);

    done(null, torrents.map(function (torrent) {
      return {
        title: torrent['title'][0],
        size: torrent['size'][0],
        torrentLink: torrent['enclosure'][0]['$']['url'],
        seeders: torrent['description'][0].replace(/^Seeds\D+(\d+).+$/, '$1'),
        leechers: torrent['description'][0].replace(/^.+Leechers\D+(\d+)$/, '$1'),
        source: 'limetorrents'
      };
    }));
  });
}
