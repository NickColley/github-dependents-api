const querystring = require('querystring');
const path = require('path');

const express = require('express');
const cors = require('cors');

const recurseDependents = require('./recurseDependents.js')

const app = express();

app.use(cors());

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})


app.get('*', async (req, res, next) => {
  const { url, path } = req
  const dependentType = (req.query['type'] || 'repository').toUpperCase()
  const limit = parseInt(req.query['limit'], 10) || 100
  if (url === '/favicon.ico') {
    return res.send('')
  }
  try {
    let entryUrl = `https://github.com${path}/network/dependents?dependent_type=${dependentType}`
    recurseDependents(
      { res, url: entryUrl, path, dependentType, limit },
      (err, data) => {
      if (err === 404) {
        return res.status(404).send(data);
      }
  
      delete data.entriesOnPage
      delete data.previousPageUrl
      delete data.nextPageUrl
      return res.send(data)
    })
  } catch (err) {
    return next(err);
  }
});

/// Setup the api
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send(
    '500: Internal server error', '500: Internal server error'
  )                  
});

module.exports = app;
