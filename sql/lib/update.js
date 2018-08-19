const { Query } = require('./query');
const { Counter, compileWhere } = require('./util');

class Update extends Query {
  constructor(cache_id) {
    super(cache_id);
  }

  toString() {
    const index = new Counter(1);
    const table = [...this.__tables.values()][0];
    const fields = [...this.__fields.values()].map((field) => `${field}=\$${index.next}`).join(', ');
    let sql = `UPDATE ${table} SET ${fields}`;

    if (this.__where.length > 0) {
      sql += ` WHERE ${compileWhere(this.__where, index)}`;
    }

    return sql;
  }
}

module.exports = { Update };
