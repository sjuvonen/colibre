const { Query } = require('./query');
const { Counter, compileWhere } = require('./util');

class Select extends Query {
  constructor(cache_id) {
    super(cache_id);

    this.__fields = new Map;
    this.__where = [];
    this.__joins = [];
    this.__params = [];
  }

  toString() {
    let select = [];

    for (let [table_alias, fields] of this.__fields) {
      if (typeof fields == 'string') {
        select.push(fields);
      } else {
        for (let [alias, name] of fields) {
          select.push(name == alias ? `${table_alias}.${name}` : `${table_alias}.${name} AS ${alias}`);
        }
      }
    }

    let from = [];

    for (let spec of this.__joins) {
      let { alias, cond } = spec;
      let table = this.__tables.get(alias);

      if (from.length) {
        from.push(`JOIN ${table} ${alias} ON ${cond}`);
      } else {
        from.push(`${table} ${alias}`);
      }
    }

    let query = `SELECT ${select.join(', ')} FROM ${from.join(' ')}`;

    if (this.__where.length > 0) {
      let index = new Counter(1);
      query += ` WHERE ${compileWhere(this.__where, index)}`;
    }

    return query;
  }

  from(table_spec, ...fields) {
    let [table, table_alias] = table_spec.split(/\s+/);
    this.table(table, table_alias);

    if (!table_alias) {
      table_alias = table;
    }

    if (fields.length) {
      this.__fields.set(table_alias, new Map(fields.map((field) => `${field} ${field}`.split(/\s+/, 2).reverse())));
    } else {
      this.__fields.set(table_alias, `${table_alias}.*`);
    }

    if (this.__joins.length == 0) {
      this.join(table_spec, null);
    }
    return this;
  }

  join(table_spec, cond) {
    let [table, alias] = `${table_spec} ${table_spec}`.split(/\s+/, 2);
    this.table(table, alias);
    this.__joins.push({alias, cond});
    return this;
  }
}

const selectQuery = {
  fields: {
    p: {
      alias_1: 'id',
      alias_2: 'name',
      alias_3: 'color'
    },
    t: ['id', 'name', 'color']
  },
  tables: {
    p: 'demo_players',
    t: 'demo_teams'
  },
  joins: [
    {
      left: 'p',
      right: 't',
      cond: ['team_id', 'id']
    }
  ],
  where: [
    {
      join: 'AND',
      conds: [
        {table: 'p', field: 'points', value: 5, op: '>'},
        {table: 't', field: 'color', value: 'green', op: '='}
      ]
    },
    {
      join: 'OR',
      conds: [
        {table: 't', field: 'color', value: 'red', op: '='}
      ]
    }
  ]
};

module.exports = { Select };
