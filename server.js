const express = require('express');
const Feed = require('rss-to-json');
const cors = require('cors');
const cache = require('./db/cache');
const feedFetch = require('./fetch-feed-promise');
const CronJob = require('cron').CronJob;
const Promise = require("bluebird");
    var request = require('request');

Promise.promisifyAll(cache);

const RSS_FEED_LIST = 'rssFeedList';

// const fetchRSSData = new CronJob('00 * * * * *', async () => {
//   try {
//     console.log('Fetching data');
//     const {feeds} = await cache.findOneAsync({key: RSS_FEED_LIST});
//     for (let feedUri of feeds) {
//       const data = await feedFetch.fetch(`https://medium.com/${feedUri}`);
//       const update = await cache.updateAsync({key: feedUri}, {data});
//     }
//   } catch (err) {
//     console.log('fetching feeds caused an error');
//   }
// }, null, true);
// cache.insert({
//   key: 'rssFeedList',
//   feeds: []
// });

const app = express();

app.use(cors());
app.get('/:register', async (req, res, next) => {
  const register = req.params.register
  if (!register) {
    return next(new Error('No register selected'));
  }
  try {
    request(`https://www.registers.service.gov.uk/registers/${register}/download-json`, function (error, response, body) {
      if (error) {
        throw error
      }
      if (response && response.statusCode === 200) {
        var parsedJson = JSON.parse(body)
        return res.json(parsedJson)
      }
    });
  } catch (err) {
    return next(err);
  }
});

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

app.get('/', (req, res, next) => {
  res.send('Ready to convert your Medium RSS feed to JSON.  Just GET https://medium-rss-to-json-proxy.glitch.me/<your_publication_name>');
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

module.exports = app;