'use strict';

var debug = require('debug')('plugins:search:filters');
var _ = require('lodash');
var filterTypes = require('./filter-types');

/**
 * Filters is an array of object {type, args}
 */
module.exports = function(filters) {
  var data = [];
  var filter = filters.reduce(function (acc, opts) {
    var filterFactory = filterTypes[opts.type];
    if (!filterFactory) {
      console.log('[CONFIG] Unknown filter type', opts.type);
      return acc;
    }
    filter = filterFactory.apply(null, opts.args);
    return acc.filter(filter);
  }, _(data));

  return function (torrents) {
    data.length = 0;
    data.push.apply(data, torrents);
    return filter.value();
  };
}
