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
  const dependantType = req.query['dependent_type'] || 'REPOSITORY'
  const perPage = parseInt(req.query['per_page'], 10) || 30
  if (url === '/favicon.ico') {
    return res.send('')
  }
  try {
    getGithubPage(`https://github.com${url}`, (response) => {
      if (response === 404) {
        return res.status(404).send(response);
      }
      const data = scrapePage(response, { path, dependantType, perPage })
      const moreResultsNeeded = (data.totalDependants < perPage) && (data.nextPageUrl !== null)
      let entries = data.entries
      console.log(moreResultsNeeded)
      if (moreResultsNeeded) {
        getGithubPage(data.nextPageUrl.replace('github-dependants.glitch.me', 'github.com'), (response) => {
          if (response === 404) {
            return res.status(404).send(response);
          }
          const data = scrapePage(response, { path, dependantType, perPage })
          console.log(data)
        })
      }
      console.log(entries)
      return res.json(data)
    })
  } catch (err) {
    return next(err);
  }
});

function scrapePage (response, { path, dependantType, perPage }) {
  let $ = cheerio.load(response)
  const $dependants = $('#dependents')
  const totalDependants =
      parseInt(
          $dependants.find(`[href='${path}?dependent_type=REPOSITORY']`)
            .text()
            .trim()
            .match('[0-9]*')[0], 10)
  const totalPackages =
      parseInt(
          $dependants.find(`[href='${path}?dependent_type=PACKAGE']`)
            .text()
            .trim()
            .match('[0-9]*')[0], 10)
  
  
  const previousPageUrl =
        ($dependants
          .find(`[href^='https://github.com${path}?dependent_type=${dependantType}&dependents_before']`)
          .attr('href') || '')
          .replace('github.com', 'github-dependants.glitch.me') || null
  const nextPageUrl =
        ($dependants
          .find(`[href^='https://github.com${path}?dependent_type=${dependantType}&dependents_after']`)
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
  }).get().slice(0, perPage)
  
  const entriesOnPage = entries.length

  return {
    perPage,
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
