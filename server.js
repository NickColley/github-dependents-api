const express = require('express');
const proxy = require('http-proxy-middleware');
const Feedme = require('feedme');

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
    const parser = new Feedme(true);
    let body = '';
    proxyRes.on('data', (data) => {
      body += data.toString('utf-8');
    });
    proxyRes.on('end', () => {
      console.log(body);
      res.write(body);
    });
    parser.on('end', () => {
      const data = parser.done();
      console.log(data);
      res.write(data);
    });
    // proxyRes.pipe(parser);
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