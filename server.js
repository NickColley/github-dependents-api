const os = require('os')

const express = require('express');
const cors = require('cors');

const cheerio = require('cheerio');

const request = require('request');
const cachedRequest = require('cached-request')(request)
cachedRequest.setCacheDirectory(os.tmpdir())

const app = express();

const cacheStaleTimeout = 0; // minutes

function getGithubPage (url, callback) {
 var requestOptions = {
    url,
    ttl: cacheStaleTimeout * 60 * 1000
  }
  cachedRequest(requestOptions, function (error, response, body) {
    if (error) {
      throw error
    }
    if (response && response.statusCode === 200) {
      return callback(body)
    } else {
      return callback(404)
    }
  });
}

app.use(cors());

app.get('*', async (req, res, next) => {
  const { url, path } = req
  const dependantType = (req.query['type'] || 'repository').toUpperCase()
  const limit = parseInt(req.query['limit'], 10) || 30
  if (url === '/favicon.ico') {
    return res.send('')
  }
  try {
    console.log(`https://github.com${path}/network/dependents?dependant_type=${dependantType}&limit=${limit}`)
    recurseDependants(
      { res, url: `https://github.com${path}/network/dependents?dependant_type=${dependantType}&limit=${limit}`, path, dependantType, limit },
      (err, data) => {
      if (err === 404) {
        return res.status(404).send(data);
      }
      return res.send(data)
    })
  } catch (err) {
    return next(err);
  }
});

function recurseDependants ({ res, url, path, dependantType, limit }, callback) {
  getGithubPage(url, (response) => {
    if (response === 404) {
      return callback(404, null);
    }
    let data = scrapePage(response, { path, dependantType, limit })
    const hasReachedLimit = data.entriesOnPage >= limit;
    if (hasReachedLimit) {
      data.entriesOnPage = limit
      data.entries = data.entries.slice(0, limit)
      return callback(null, data)
    }
    const moreResultsNeeded = (data.totalDependants > data.entriesOnPage) && (data.nextPageUrl !== null)
    if (!moreResultsNeeded) {
      delete data.nextPageUrl
      delete data.previousPageUrl
      console.log(data)
      return callback(null, data)
    }
    let deepData = recurseDependants({
      res,
      url: data.nextPageUrl.replace('github-dependants.glitch.me', 'github.com'),
      path,
      dependantType,
      limit
    }, (err, deepData) => {
      if (err) {
        throw new Error('deep failed')
      }
      data.entries = data.entries.concat(deepData.entries)
      data.entriesOnPage = data.entries.length
      return callback(null, data)
    })
  })
}

function scrapePage (response, { path, dependantType, limit }) {
  let $ = cheerio.load(response)
  const $dependants = $('#dependents')
  const totalDependants =
      parseInt(
          $dependants.find(`[href='${path}/network/dependents?dependent_type=REPOSITORY']`)
            .text()
            .trim()
            .match('[0-9]*')[0], 10)
  const totalPackages =
      parseInt(
          $dependants.find(`[href='${path}/network/dependents?dependent_type=PACKAGE']`)
            .text()
            .trim()
            .match('[0-9]*')[0], 10)
  
  
  const previousPageUrl =
        ($dependants
          .find(`[href^='https://github.com${path}/network/dependents?dependent_type=${dependantType}&dependents_before']`)
          .attr('href') || '')
          .replace('github.com', 'github-dependants.glitch.me') || null
  const nextPageUrl =
        ($dependants
          .find(`[href^='https://github.com${path}/network/dependents?dependent_type=${dependantType}&dependents_after']`)
          .attr('href') || '')
          .replace('github.com', 'github-dependants.glitch.me') || null
  
  const $entries = $dependants.find('.Box-row')
  const entries = $entries.map((index, entry) => {
    let $entry = $(entry)
    let avatarImage = $entry.find('.avatar').attr('src');
    let org = $entry.find('[href]:not([class])').text().trim();
    let repo = $entry.find('[href].text-bold').text().trim();
    let stars = parseInt($entry.find('.octicon-star').parent().text().trim(), 10)
    let forks = parseInt($entry.find('.octicon-repo-forked').parent().text().trim(), 10)
    return {
      avatarImage,
      org,
      repo,
      stars,
      forks
    }
  }).get()
  
  const entriesOnPage = entries.length

  return {
    limit,
    entriesOnPage,
    totalDependants,
    totalPackages,
    previousPageUrl,
    nextPageUrl,
    entries
  }
}

/// Setup the api
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send(
    '500: Internal server error', '500: Internal server error'
  )                  
});

module.exports = app;
