const { Select } = require('./lib/select');
const { Insert } = require('./lib/insert');
const { Update } = require('./lib/update');

function select(cache_id) {
  return new Select(cache_id);
}

function insert(cache_id) {
  return new Insert(cache_id);
}

function update(cache_id) {
  return new Update(cache_id);
}

module.exports = {
  Select, select,
  Insert, insert,
  Update, update,
};
