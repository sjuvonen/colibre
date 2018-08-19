const { Query } = require('./query');
const { Counter } = require('./util');

class Insert extends Query {
  constructor(cache_id) {
    super(cache_id);
    this.__fields = new Map;
  }

  into(table_spec) {
    let [table, alias] = table_spec.split(/\s+/);
    return this.table(table, alias || table);
  }

  toString() {
    let index = new Counter(1);
    let table = [...this.__tables.values()][0];
    let fields = [...this.__fields.values()].join(', ');
    let values = Array.from(Array(this.__fields.size), () => '$' + index.next).join(', ');
    let sql = `INSERT INTO ${table} (${fields}) VALUES (${values})`;
    return sql;
  }
}

const insertQuery = {
};

module.exports = { Insert };
