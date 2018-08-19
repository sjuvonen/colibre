const cms = require('@colibre/cms');

const config = require('./config');

cms.run(config).then(([addr, port]) => {
  console.log(`server listening on ${addr}:${port}`);
});
