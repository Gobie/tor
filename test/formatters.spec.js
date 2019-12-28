var assert = require('assert')
var formatters = require('../lib/formatters')

describe('formatters', () => {
  describe('episode', () => {
    it('should handle valid episode', () => {
      var formattedEpisode = formatters.episode(1, 1)
      assert.equal(formattedEpisode, 'S01E01')
    })

    it('should handle malformed episode', () => {
      var formattedEpisode = formatters.episode(1, undefined)
      assert.equal(formattedEpisode, 'S01E00')
    })

    it('should handle malformed season', () => {
      var formattedEpisode = formatters.episode(null, 5)
      assert.equal(formattedEpisode, 'S00E05')
    })
  })

  describe('filesize', () => {
    it('should handle valid filesize', () => {
      var formattedFilesize = formatters.filesize(1e7)
      assert.equal(formattedFilesize, '9.54 MB')
    })

    it('should handle malformed filesize', () => {
      var formattedFilesize = formatters.filesize(null)
      assert.equal(formattedFilesize, '0 bytes')
    })
  })
})
