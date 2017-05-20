const rsj = require('rsj');

module.exports = {
  fetch: (url) => {
    return new Promise((resolve, reject) => {
      rsj.r2j(url, (data) => {
        resolve(data);
      });
    });
  }
}