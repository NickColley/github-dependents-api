const os = require('os')

const express = require('express');
const cors = require('cors');

const cheerio = require('cheerio');

const request = require('request');
const cachedRequest = require('cached-request')(request)
cachedRequest.setCacheDirectory(os.tmpdir())

const app = express();

const cacheStaleTimeout = 10; // minutes

function getContentItem (path, addURL, callback) {
 var requestOptions = {
    url: `https://github.com/${path}?dependent_type=REPOSITORY`,
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

app.get('/:path?', async (req, res, next) => {
  const input = req.params.path
  const isRoot = !input
  let path
  // If no param set, default to the `path` path
  if (isRoot) {
    path = '/'
  } else {
    path = req.params.path
  }
  path = 'alphagov/govuk-frontend/network/dependents'
  try {
    getContentItem(path, isRoot, (response) => {
      if (response === 404) {
        return res.status(404).send(response);
      }
      const json = scrapePage(response, { path })
      return res.json(json)
    })
  } catch (err) {
    return next(err);
  }
});

function scrapePage (response, { path }) {
  let $ = cheerio.load(response)
  const $dependants = $('#dependents')
  const totalDependants =
      parseInt(
          $dependants.find(`[href='/${path}?dependent_type=REPOSITORY']`)
            .text()
            .trim()
            .match('[0-9]*')[0], 10)
  const totalPackages =
      parseInt(
          $dependants.find(`[href='/${path}?dependent_type=PACKAGE']`)
            .text()
            .trim()
            .match('[0-9]*')[0], 10)
  
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

  return {
    totalDependants,
    totalPackages,
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
