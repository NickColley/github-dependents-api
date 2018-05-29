const express = require('express');
const cors = require('cors');
const request = require('request');

const app = express();

app.use(cors());
app.get('/:register', async (req, res, next) => {
  const register = req.params.register
  if (!register) {
    return next(new Error('No register selected'));
  }
  try {
    request(`https://www.registers.service.gov.uk/registers/${register}/download-json`, function (error, response, body) {
      if (error) {
        throw error
      }
      if (response && response.statusCode === 200) {
        var parsedJson = JSON.parse(body)
        return res.json(parsedJson)
      } else {
        return res.sendStatus(404)
      }
    });
  } catch (err) {
    return next(err);
  }
});

// Setup the status page
app.use(require('express-status-monitor')());

// Setup the api
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + server.address().port);
});

app.get('/', (req, res, next) => {
  res.send('Ready to convert your Medium RSS feed to JSON.  Just GET https://medium-rss-to-json-proxy.glitch.me/<your_publication_name>');
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

module.exports = app;