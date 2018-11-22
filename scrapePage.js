const cheerio = require('cheerio');

function scrapePage (response, { path, dependentType, limit }) {
  let $ = cheerio.load(response)
  const $dependants = $('#dependents')
  const totalDependants =
      parseInt(
          $dependants.find(`[href='${path}/network/dependents?dependent_type=REPOSITORY']`)
            .text()
            .trim()
            .replace(/,/g, '')
            .match('[0-9]*')[0], 10)
  const totalPackages =
      parseInt(
          $dependants.find(`[href='${path}/network/dependents?dependent_type=PACKAGE']`)
            .text()
            .trim()
            .replace(/,/g, '')
            .match('[0-9]*')[0], 10)
  
  
  const previousPageUrl =
        ($dependants
          .find(`[href^='https://github.com${path}/network/dependents?dependent_type=${dependentType}&dependents_before']`)
          .attr('href') || '') || null
  const nextPageUrl =
        ($dependants
          .find(`[href^='https://github.com${path}/network/dependents?dependent_type=${dependentType}&dependents_after']`)
          .attr('href') || '') || null
  
  const $entries = $dependants.find('.Box-row')
  const entries = $entries.map((index, entry) => {
    let $entry = $(entry)
    let avatarImage = $entry.find('.avatar').attr('src');
    let isGhost = $entry.find('[alt="@ghost"]').length > 0
    let org = $entry.find('[href]:not([class])').text().trim();
    let repo = $entry.find('[href].text-bold').text().trim();
    if (isGhost) {
      repo = $entry.find('.text-gray-light').text().trim();
    }
    let stars = parseInt($entry.find('.octicon-star').parent().text().trim(), 10)
    let forks = parseInt($entry.find('.octicon-repo-forked').parent().text().trim(), 10)
    return {
      isGhost,
      avatarImage,
      org,
      repo,
      stars,
      forks
    }
  }).get()
  
  const entriesOnPage = entries.length

  return {
    entriesOnPage,
    totalDependants,
    totalPackages,
    previousPageUrl,
    nextPageUrl,
    entries
  }
}

module.exports = scrapePage