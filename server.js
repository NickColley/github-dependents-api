const express = require('express');
const Feed = require('rss-to-json');
const rsj = require('rsj');
const cors = require('cors');
const cache = require('./db/cache');
const CronJob = require('cron').CronJob;

const fetchRSSData = new CronJob('00 00 * * * *', () =>{
  console.log('hello');
}, null, true);

cache.insert({
  key: 'rssFeedList',
  value: []
});

const app = express();

app.use(cors());
app.get('/rss/:data(*)', (req, res, next) => {
  const processData = (data, alreadyStored) => {
    let parsed = JSON.parse(data);
    const limit = +req.query.limit;
    if (!isNaN(limit)) {
      parsed = parsed.slice(0, limit);
    }
    res.json(parsed);
  };
  
  cache.find({key: 'rssFeedList'}, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
      processData(docs, true);  
    }
  });
});

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
const server = app.listen(process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});

app.get('/', function (req, res, next) {
  res.send('Ready');
});

module.exports = app;