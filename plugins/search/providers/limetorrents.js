'use strict';

var debug = require('debug')('plugins:search:providers:limetorrents');
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
  req.on('error', function(err) {
    callback(err);
  });
}

module.exports = function (query, done) {
  debug('searching for %s', query);

  search({
    url: 'https://www.limetorrents.cc/searchrss/' + encodeURIComponent(query) + '/'
  }, function (err, results) {
    if (err) {
      console.log('[ERROR] limetorrents', err);
      return done(null, []);
    }

    done(null, (results.rss.channel[0].item || []).map(function (release) {
      return {
        title: release['title'][0],
        size: release['size'][0],
        torrentLink: release['enclosure'][0]['$']['url'],
        seeders: release['description'][0].replace(/^Seeds\D+(\d+).+$/, '$1'),
        leechers: release['description'][0].replace(/^.+Leechers\D+(\d+)$/, '$1'),
        source: 'limetorrents'
      };
    }));
  });
}
