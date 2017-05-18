const express = require('express');
const proxy = require('http-proxy-middleware');
const Feedme = require('feedme');
const parseString = require('xml2js').parseString;
const parser = require('rss-parser');
const Feed = require('rss-to-json');

const options = {
  logLevel: 'debug',
  target: 'https://medium.com',
  changeOrigin: true,
  headers: {
    'Accept': 'application/rss+xml',
  },
  pathRewrite: {
    '^/api' : ''
  },
  secure: false,
  ssl: {
    rejectUnauthorized: false
  },
  onProxyRes: (proxyRes, req, res) => {
    let body = '';
    const feed = new Feedme(true);
    proxyRes.on('data', (data) => {
      console.log(typeof data, data.toString('utf8'));
      feed.write(data.toString('utf8'));
    });
    proxyRes.on('end', () => {
      console.log('end');
    });
    feed.on('end', () => {
      const data = feed.done();
      console.log(data);
      res.write(data);
    });
  }
};
// var apiProxy = proxy(options);

var app = express();

app.get('/hello', (req, res, next) => {
  res.send('hello');
});

app.get('/rss/:data(.*)', (req, res, next) => {
  console.log('/rss');
  res.json(req.params);
  // Feed.load(`https://medium.com/${req.params.data}`, (err, data) => {
  //     res.json(data);
  // });
});

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
// app.use('/api', apiProxy);

var server = app.listen(process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});

app.get('/', function (req, res, next) {
  res.send('Ready');
});

module.exports = app;