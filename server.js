const express = require('express');
const Feed = require('rss-to-json');
const rsj = require('rsj');
const cors = require('cors');
const cache = require('./db/cache');
const CronJob = require('cron').CronJob;
const Promise = require("bluebird");
Promise.promisifyAll(cache);

const RSS_FEED_LIST = 'rssFeedList';

const fetchRSSData = new CronJob('00 00 * * * *', () => {
  console.log('hello');
  // cache.find()
}, null, true);

cache.insert({
  key: 'rssFeedList',
  feeds: []
});

const app = express();

app.use(cors());
app.get('/rss/:data(*)', async (req, res, next) => {
  if (req.params.data === RSS_FEED_LIST) {
    return next(new Error('Incorrect parameter'));
  }
  const processData = (data, alreadyStored) => {
    let parsed = JSON.parse(data);
    const limit = +req.query.limit;
    if (!isNaN(limit)) {
      parsed = parsed.slice(0, limit);
    }
    res.json(parsed);
  };
  
  cache.findOne({key: RSS_FEED_LIST}, (err, doc) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    console.log(doc);
    if (doc.feeds.indexOf(req.params.data) > -1) {
      cache.findOne({key: req.params.data}, (err, doc) => {
        if (err) return next(err);
        console.log(doc);
        return processData(doc.data);
      });
    } else {
      cache.update({key: RSS_FEED_LIST}, {$push: {feeds: req.params.data}}, {}, (err, updatedDoc) => {
        rsj.r2j(`https://medium.com/${req.params.data}`, (data) => {
          cache.insert({key: req.params.data, data}, (err) => {
            if (err) return next(err);
            return processData(data);
          });
        });
      });
    }
  });
});

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

app.get('/', (req, res, next) => {
  res.send('Ready');
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

module.exports = app;