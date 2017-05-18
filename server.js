const express = require('express');
const Feed = require('rss-to-json');
const rsj = require('rsj');
const cors = require('cors');

const app = express();

const whitelist = ['http://localhost:4200', 'https://medium-rss-to-json-proxy.glitch.me', 'undefined'];
app.use(cors());

app.get('/rss/:data(*)', (req, res, next) => {
  console.log(req.params.data, req.query);
  rsj.r2j(`https://medium.com/${req.params.data}`, (data) => res.json(JSON.parse(data)));
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