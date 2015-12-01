'use strict';

var _ = require('lodash');
var filterTypes = require('./filter-types');

/**
 * Filters are an array of object {type, args}
 */
module.exports = function(program, filters) {
  var filterTypesFactory = filterTypes(program);
  var data = [];
  var filter = filters.reduce(function (acc, opts) {
    var filterFactory = filterTypesFactory[opts.type];
    if (!filterFactory) {
      program.log.error('unknown filter type', opts.type);
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
