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
    const _write = res.write;
    let output;
    let body = "";
    const parser = new Feedme();
    proxyRes.on('data', function(data) {
      data = data.toString('utf-8');
      body += data;
    });
    res.write = function (data) {
      try{
        eval("output="+body)
        output = mock.mock(output)
        _write.call(res,JSON.stringify(output));
      } catch (err) {}
    }
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