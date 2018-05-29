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
        var item = parsedJson[key].item[0]
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

// Pretty print JSON
app.set('json spaces', 2); 

// app.use(cors());

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
        return getRegister('register', false, (response) => {
          console.log(response)
          var list = response;
          var key = 'register';
          const youMeant = didYouMean(input, list, key)
          const meantResponse = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Did you mean <strong>“${youMeant}”</strong>?</title>
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
  <p>
    <h1>
      Did you mean <strong>“${youMeant}”</strong>?
    </h1>
    <br>
    Try <a href="https://registers.glitch.me/${youMeant}">https://registers.glitch.me/${youMeant}</a>.
  </p>
</body>
</html>
          `.trim()
          if (youMeant) {
            return res.status(404).send(meantResponse);
          }
         return res.sendStatus(404)
        })
      }
      return res.json(response)
    })
  } catch (err) {
    return next(err);
  }
});

// Setup the api
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

app.get('/', (req, res, next) => {
  res.send('https://www.registers.service.gov.uk/registers');
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

module.exports = app;
