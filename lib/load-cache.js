'use strict';

var jsonfile = require('jsonfile');
var _ = require('lodash');

module.exports = function(cacheName) {
  var data = {};
  try {
    data = jsonfile.readFileSync(cacheName);
  } catch (e) {}

  return {
    // TODO cache episode info (status: ended/running, last season episodes, ids, external ids)
    data: _.defaults(data, {
      trakt: {},
      lastEpisodes: {}
    }),
    save: function () {
      jsonfile.writeFileSync(cacheName, data);
    }
  };
}


