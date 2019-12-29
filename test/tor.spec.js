// TODO this is integration test, split these from unit tests
var assert = require('assert')
var exec = require('child_process').exec
var path = require('path')

describe('tor bin', function() {
  this.timeout(4000)

  var cmd =
    'WORKING_DIRECTORY=$(pwd) node ' + path.join(__dirname, '../bin/tor')

  it('--help should run without errors', done => {
    exec(cmd + ' --help', error => {
      assert.equal(error, null)
      done()
    })
  })

  it('--version should run without errors', done => {
    exec(cmd + ' --version', error => {
      assert.equal(error, null)
      done()
    })
  })

  it('should return error on missing command', done => {
    exec(cmd, error => {
      assert.ok(error)
      assert.equal(error.code, 1)
      done()
    })
  })

  it.skip('should return error on unknown command', done => {
    exec(cmd + ' junkcmd', error => {
      assert.ok(error)
      assert.equal(error.code, 1)
      done()
    })
  })
})
