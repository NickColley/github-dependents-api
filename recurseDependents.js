const getGithubPage = require('./getGithubPage.js')
const scrapePage = require('./scrapePage.js')

function recurseDependents ({ res, url, path, dependentType, limit }, callback) {
  getGithubPage(url, (response) => {
    if (response === 404) {
      return callback(404, null);
    }
    let data = scrapePage(response, { path, dependentType, limit })
    const hasReachedLimit = data.entriesOnPage >= limit;
    if (hasReachedLimit) {
      data.entriesOnPage = limit
      data.entries = data.entries.slice(0, limit)
      return callback(null, data)
    }
    const moreResultsNeeded = (data.totalDependants > data.entriesOnPage) && (data.nextPageUrl !== null)
    if (!moreResultsNeeded) {
      return callback(null, data)
    }
    let deepData = recurseDependents({
      res,
      url: data.nextPageUrl.replace('github-dependants.glitch.me', 'github.com'),
      path,
      dependentType,
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

module.exports = recurseDependents