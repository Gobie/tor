'use strict';

var _ = require('lodash');
var filterTypes = require('./filter-types');

/**
 * @param {Array<{type, args}>} filters values from config
 */
module.exports = function (program, filters) {
  var filterTypesFactory = filterTypes(program);
  var data = [];

  // create deferred filter chain
  var filterChain = filters.reduce(function (acc, opts) {
    var filterFactory = filterTypesFactory[opts.type];
    if (!filterFactory) {
      program.log.error('unknown filter type', opts.type);
      return acc;
    }
    // create filter with args from config
    var filter = filterFactory.apply(null, opts.args);
    // add filter to deferred chain
    return acc.filter(filter);
  }, _(data));

  return function (torrents) {
    // change source data for filter
    data.length = 0;
    data.push.apply(data, torrents);
    // evaluate chain
    return filterChain.value();
  };
};
