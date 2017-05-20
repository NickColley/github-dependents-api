const express = require('express');
const Feed = require('rss-to-json');
const rsj = require('rsj');
const cors = require('cors');
const cache = require('./db/cache');

const app = express();

app.use(cors());

app.get('/rss/:data(*)', (req, res, next) => {
  cache.find({key: req.params.data}, (err, docs) => {
    
  });
  rsj.r2j(`https://medium.com/${req.params.data}`, (data) => {
    let parsed = JSON.parse(data);
    const limit = +req.query.limit;
    if (!isNaN(limit)) {
      parsed = parsed.slice(0, limit);
    }
    res.json(parsed);
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