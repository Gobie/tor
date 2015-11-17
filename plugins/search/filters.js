'use strict';

var debug = require('debug')('plugins:search:filters');
var _ = require('lodash');
var filterTypes = require('./filter-types');

/**
 * Filters are an array of object {type, args}
 */
module.exports = function(filters) {
  var data = [];
  var filter = filters.reduce(function (acc, opts) {
    var filterFactory = filterTypes[opts.type];
    if (!filterFactory) {
      console.log('[CONFIG] Unknown filter type', opts.type);
      return acc;
    }
    // create filter with args from config
    filter = filterFactory.apply(null, opts.args);
    // add filter to deferred chain
    return acc.filter(filter);
  }, _(data));

  return function (torrents) {
    // change source data for filter
    data.length = 0;
    data.push.apply(data, torrents);
    // evaluate chain
    return filter.value();
  };
};
