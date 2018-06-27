const os = require('os')

const express = require('express');
const cors = require('cors');

const request = require('request');
const cachedRequest = require('cached-request')(request)
cachedRequest.setCacheDirectory(os.tmpdir())

const app = express();

const cacheStaleTimeout = 250; // minutes

function getContentItem (path, addURL, callback) {
 var requestOptions = {
    url: `https://www.gov.uk/api/content/${path}`,
    ttl: cacheStaleTimeout * 60 * 1000
  }
  cachedRequest(requestOptions, function (error, response, body) {
    if (error) {
      throw error
    }
    if (response && response.statusCode === 200) {
      var parsedJson = JSON.parse(body)
      return callback(parsedJson)
    } else {
      return callback(404)
    }
  });
}

function renderHtml (title, message) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>${title}</title>
  <style>
    body {
      font-size: 20px;
      font-family: Georgia, serif;
      padding: 1em;
    }
    h1 {
      font-weight: normal;
    }
  </style>
</head>
<body>
  <main>
    <h1>${message}</h1>
  </main>
</body>
</html>`.trim()
}

// Pretty print JSON
app.set('json spaces', 2); 

app.use(cors());

app.get('/:path?', async (req, res, next) => {
  const input = req.params.path
  const isRoot = !input
  let path
  // If no param set, default to the `path` path
  if (isRoot) {
    path = '/'
  } else {
    path = req.params.path
  }
  try {
    getContentItem(path, isRoot, (response) => {
      if (response === 404) {
        return res.status(404).send(response);
      }
      return res.json(response)
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
    renderHtml('500: Internal server error', '500: Internal server error')
  )                  
});

module.exports = app;
