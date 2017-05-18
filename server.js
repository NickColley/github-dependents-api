const express = require('express');
const proxy = require('http-proxy-middleware');
const Feedme = require('feedme');
const parseString = require('xml2js').parseString;

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
      console.log(typeof data, data);
      feed.write(data.toString('utf-8'));
    });
    proxyRes.on('end', () => {
      console.log(body);
      console.log(typeof body);
      parseString(body, (err, result) => {
        console.log(err, result);
        res.write(result);
      });
    });
  }
};
var apiProxy = proxy(options);

var app = express();

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
app.use('/api', apiProxy);
var server = app.listen(process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});
app.use('/', function (req, res, next) {
  res.send('Ready');
});
module.exports = app;