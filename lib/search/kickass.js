'use strict';

var debug = require('debug')('lib:search-kickass');
var zlib = require('zlib');
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var search = function(options, callback) {
  var chunks = [];
  var res = request(options).pipe(zlib.createGunzip());
  res.on('error', callback);
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
}

module.exports = function(query, done) {
  debug('searching for %s', query);

  search({
    url: 'https://kat.cr/usearch/' + encodeURIComponent(query) + '%20category%3Atv%20seeds%3A5%20is_safe%3A1/?rss=1&field=seeders&sorder=desc'
  }, function (err, results) {
    if (err) {
      console.log('[ERROR] kickass', err);
      return done(null, []);
    }
    if (!results) return done(null, []);

    done(null, (results.rss.channel[0].item || []).map(function(release) {
      return {
        title: release['title'][0],
        size: release['torrent:contentLength'][0],
        torrentLink: release['enclosure'][0]['$']['url'],
        seeders: release['torrent:seeds'][0],
        leechers: release['torrent:peers'][0],
        source: 'kickass'
      }
    }));
  });
}
