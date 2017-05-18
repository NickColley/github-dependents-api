const express = require('express');
const Feed = require('rss-to-json');

const app = express();

app.get('/rss/:data(*)', (req, res, next) => {
  Feed.load(`https://medium.com/${req.params.data}`, (err, data) => {
      res.json(data);
  });
});

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
var server = app.listen(process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});

app.get('/', function (req, res, next) {
  res.send('Ready');
});

module.exports = app;