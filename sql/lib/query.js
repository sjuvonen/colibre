class Query {
  constructor(cache_id) {
    this.__id = cache_id;
    this.__params = [];
    this.__tables = new Map;
    this.__fields = new Map;
    this.__where = [];
  }

  get id() {
    return this.__id;
  }

  get params() {
    return this.__params.slice();
  }

  get sql() {
    if (!this.__sql) {
      this.__sql = this.toString();
    }
    return this.__sql;
  }

  table(name, alias) {
    this.__tables.set(alias || name, name);
    return this;
  }

  set(field_spec, value) {
    let [field, alias] = field_spec.split(/\s+/);
    this.__fields.set(field, alias || field);
    this.__params.push(value);
    return this;
  }

  orWhere(field_spec, value, operator) {
    return this.addCondition(field_spec, value, operator, 'OR');
  }

  andWhere(field_spec, value, operator) {
    return this.addCondition(field_spec, value, operator, 'AND');
  }

  where(field_spec, value, operator) {
    this.__where = [];
    return this.andWhere(field_spec, value, operator);
  }

  addConditionGroup(join = 'AND') {
    this.__where.push({join: 'AND', conds: []});
  }

  addCondition(field_spec, value, operator, join = 'AND') {
    if (this.__where.length == 0) {
      this.addConditionGroup();
    }

    if (!operator) {
      operator = Array.isArray(value) ? 'IN' : '=';
    }

    const type_array = Array.isArray(value);
    let [field_name, table_alias] = field_spec.split(/\./).reverse();

    const condition = {
      join: join,
      table: table_alias,
      field: field_name,
      // op: operator || type_array ? 'IN' : '=',
      // count: type_array ? value.length : 1,
    };

    if (Array.isArray(value)) {
      condition.op = operator || 'IN';
      condition.count = value.length
      this.__params.push(...value);
    } else {
      condition.op = operator || '=';
      condition.count = 1;
      this.__params.push(value);
    }

    this.__where[this.__where.length - 1].conds.push(condition);
    return this;
  }
}

module.exports = { Query };
