'use strict';

// TODO this is integration test, split these from unit tests
var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');

describe('tor bin', function () {
  var cmd = 'node ' + path.join(__dirname, '../bin/tor') + ' ';

  it('--help should run without errors', function (done) {
    exec(cmd + '--help', function (error) {
      assert.equal(error, null);
      done();
    });
  });

  it('--version should run without errors', function (done) {
    exec(cmd + '--version', function (error) {
      assert.equal(error, null);
      done();
    });
  });

  it('should return error on missing command', function (done) {
    this.timeout(4000);

    exec(cmd, function (error) {
      assert(error);
      assert.equal(error.code, 1);
      done();
    });
  });

  it('should return error on unknown command', function (done) {
    this.timeout(4000);

    exec(cmd + 'junkcmd', function (error) {
      assert(error);
      assert.equal(error.code, 1);
      done();
    });
  });
});
