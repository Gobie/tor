const path = require('path')
const ptn = require('parse-torrent-name')

const parseFilename = (filename, options) => {
  const ext = path.extname(filename).toLowerCase()
  // the following regex should match:
  //   Community S01E04.mp4
  //   Community s01e04.mp4
  //   Community 1x04.mp4
  //   Community 1-04.mp4
  //   Community/S01E04.mp4
  //   Community/s01e04.mp4
  //   Community/1x04.mp4
  //   Community/1-04.mp4
  //   Community/Season 1/Episode 4.mp4
  let re = /(.*)\D(\d{1,2})[ex-](\d{1,2})/i
  let searchResults = filename.match(re)
  let show
  let season
  let episode
  let offset

  options = options || {}

  offset = options.offset || 0
  if (searchResults === null) {
    // this regex should match:
    //   Community Season 1 Episode 4.mp4
    // (case insensitive)
    re = /(.*)Season.*?(\d{1,2}).*Episode\D*?(\d{1,2})/i
    searchResults = filename.match(re)
  }

  if (searchResults === null) {
    // this regex should match:
    //   Community 104.mp4
    re = /(.*)\D(\d)(\d\d)\D/
    searchResults = filename.match(re)
  }

  if (searchResults === null && options.season) {
    // this regex should match:
    //   Community 04.mp4
    // but only if we've specified a season with season flag
    re = /(.*)\D(\d+)\D/
    searchResults = filename.match(re)
  }

  if (searchResults === null && options.season && options.show) {
    // this regex should match:
    //   04.mp4
    // but only if we've specified a season and show with flags
    re = /(\d+)\D/
    searchResults = filename.match(re)
  }

  try {
    show = options.show || searchResults[1]
  } catch (e) {
    return null
  }
  show = show
    // remove hanging characters
    .replace(/^[-.\s]+|[-.\s\/]+$/g, '')
    .trim()

  if (options.episode) {
    episode = options.episode + offset
    if (searchResults !== null) {
      searchResults.pop()
    }
  } else {
    try {
      episode = Number(searchResults.pop()) + offset
    } catch (e) {
      return null
    }
  }

  season = options.season || Number(searchResults.pop())

  return {
    originalFilename: filename,
    name: show,
    season: season,
    episode: episode,
    extension: ext,
  }
}

const parseMultiEpisode = filename => {
  // the following regex should match:
  //   Community S01E04E05.mp4
  //   Community S01x04x05.mp4
  //   Community S01-04-05.mp4
  //   Community S01E04+E05.mp4
  let re = /^(.*?)(\d{1,2})([ex-])(\d{1,2})[+-]?([ex-])(\d{1,2})(.*)$/i
  let m = filename.match(re)

  if (m !== null) {
    return [m[1] + m[2] + m[3] + m[4] + m[7], m[1] + m[2] + m[3] + m[6] + m[7]]
  }

  // the following regex should match:
  //   Community 60102.mp4
  re = /^(.*?\D)(\d)(\d{2})(\d{2})(\D.*)$/
  m = filename.match(re)

  if (m !== null) {
    return [
      m[1] + 'S' + m[2] + 'E' + m[3] + m[5],
      m[1] + 'S' + m[2] + 'E' + m[4] + m[5],
    ]
  }

  return false
}

module.exports = async (program, config, filePath) => {
  const fileName = path.basename(filePath)
  const episodes = parseMultiEpisode(fileName) || [fileName]
  const shows = []
  let baseName

  for (let i = 0; i < episodes.length; ++i) {
    let show = parseFilename(episodes[i])

    if (!show || !show.season || !show.episode) {
      program.log.debug('found weird episode', filePath)
      baseName = path.basename(filePath)
      program.log.debug('retrying to parse %s', baseName)
      show = ptn(baseName)
    }

    if (!show || !show.season || !show.episode) {
      baseName = path.basename(path.dirname(filePath))
      program.log.debug('retrying to parse directory %s', baseName)
      show = ptn(baseName)
    }

    if (!show || !show.season || !show.episode) {
      program.log.warn('failed to parse %s', filePath)
      continue
    }

    if (show) {
      const m = filePath.match(config.parser.accept)
      if (m === null) {
        program.log.warn('found weird directory structure', filePath)
        continue
      }
      show.path = m[1]
      if (!show.name && show.title) {
        show.name = show.title
      }
      show.source = 'file'
    }

    shows.push(show)
  }

  return shows
}
