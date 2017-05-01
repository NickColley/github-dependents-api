var express = require('express');
var proxy = require('http-proxy-middleware');
var options = {
  logLevel: 'debug',
  target: 'https://api.airtable.com/v0/',
  changeOrigin: true,
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + process.env.API_KEY
  },
  pathRewrite: {
    '^/api' : ''
  },
  secure: false,
  ssl: {
    rejectUnauthorized: false
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