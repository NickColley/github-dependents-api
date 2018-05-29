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
app.get('/', async (req, res, next) => {
  try {
    request('https://www.registers.service.gov.uk/registers/allergen/download-json', function (error, response, body) {
      if (error ) {
        throw error
      }
      if (
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
      
      var responseJSON = { foo: 'bar' }
      return res.json(responseJSON)
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