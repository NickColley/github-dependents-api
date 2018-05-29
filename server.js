const express = require('express');
const cors = require('cors');
const request = require('request');

const app = express();

// Pretty print JSON
app.set('json spaces', 2); 

app.use(cors());

app.get('/:register?', async (req, res, next) => {
  const isRoot = !req.params.register
  let register
  // If no param set, default to the `register` register
  if (isRoot) {
    register = 'register'
  } else {
    register = req.params.register
  }
  try {
    request(`https://www.registers.service.gov.uk/registers/${register}/download-json`, function (error, response, body) {
      if (error) {
        throw error
      }
      if (response && response.statusCode === 200) {
        var parsedJson = JSON.parse(body)
        var jsonKeys = Object.keys(parsedJson)
        var jsonOutput = jsonKeys.map(key => {
          var item = parsedJson[key].item[0]
          // If default, wack a useful field to get to other registers.
          if (isRoot) {
            item['__URL__'] = `https://registers.glitch.me/${item.register}`
          }
          return item
        })
        return res.json(jsonOutput)
      } else {
        return res.sendStatus(404)
      }
    });
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