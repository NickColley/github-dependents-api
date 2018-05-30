const os = require('os')

const express = require('express');
const cors = require('cors');

const request = require('request');
const cachedRequest = require('cached-request')(request)
cachedRequest.setCacheDirectory(os.tmpdir())

const didYouMean = require('didyoumean')

const app = express();

const cacheStaleTimeout = 250; // minutes

function getRegister (register, addURL, callback) {
 var requestOptions = {
    url: `https://www.registers.service.gov.uk/registers/${register}/download-json`,
    ttl: cacheStaleTimeout * 60 * 1000
  }
  cachedRequest(requestOptions, function (error, response, body) {
    if (error) {
      throw error
    }
    if (response && response.statusCode === 200) {
      var parsedJson = JSON.parse(body)
      var jsonKeys = Object.keys(parsedJson)
      var jsonOutput = jsonKeys.map(key => {
        var item = parsedJson[key]
        // If default, wack a useful field to get to other registers.
        if (addURL) {
          item['__URL__'] = `https://registers.glitch.me/${item.register}`
        }
        return item
      })
      console.timeEnd('register')
      return callback(jsonOutput)
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

app.get('/:register?', async (req, res, next) => {
  console.time('register')
  const input = req.params.register
  const isRoot = !input
  let register
  // If no param set, default to the `register` register
  if (isRoot) {
    register = 'register'
  } else {
    register = req.params.register
  }
  try {
    getRegister(register, isRoot, (response) => {
      if (response === 404) {
        // If we don't find a register, check the '
        return getRegister('register', false, (json) => {
          let response
          const youMeant = didYouMean(input, json, 'register')
          if (youMeant) {
            response = renderHtml(
              `Did you mean “${youMeant}”?`,
              `Did you mean <strong>“<a href="https://registers.glitch.me/${youMeant}">${youMeant}</a>”</strong>?`
            )
          } else {
            response = renderHtml('Not found', 'Not found')
          }
          return res.status(404).send(response);
        })
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


app.get('/', (req, res, next) => {
  res.send('https://www.registers.service.gov.uk/registers');
});
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send(
    renderHtml('500: Internal server error', '500: Internal server error')
  )                  
});

module.exports = app;
