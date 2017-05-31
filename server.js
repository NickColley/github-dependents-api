const express = require('express');
const Feed = require('rss-to-json');
const cors = require('cors');
const cache = require('./db/cache');
const feedFetch = require('./fetch-feed-promise');
const CronJob = require('cron').CronJob;
const Promise = require("bluebird");
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
app.get('/rss/:data(*)', async (req, res, next) => {
  if (req.params.data === RSS_FEED_LIST) {
    return next(new Error('Incorrect parameter'));
  }
  
  const processData = (data) => {
    let parsed = JSON.parse(data);
    const limit = +req.query.limit;
    if (!isNaN(limit)) {
      parsed = parsed.slice(0, limit);
    }
    res.json(parsed);
  };
  
  try {
    // const {feeds} = await cache.findOneAsync({key: RSS_FEED_LIST});
    // if (feeds.indexOf(req.params.data) > -1) {
    //   const {data} = await cache.findOneAsync({key: req.params.data});
    //   return processData(data);
    // } else {
      // await cache.updateAsync({key: RSS_FEED_LIST}, {$push: {feeds: req.params.data}});
      const data = await feedFetch.fetch(`https://medium.com/${req.params.data}`);
      // await cache.insertAsync({key: req.params.data, data});
      return processData(data);
    // }
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