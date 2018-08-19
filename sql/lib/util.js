class Counter {
  constructor(start = 0) {
    this.__i = start;
  }

  get current() {
    return this.__i;
  }

  get next() {
    return this.__i++;
  }
}

/**
 * @param cond_groups Array of condition groups.
 * @param index Counter instance used to keep track of parameter numbers.
 */
function compileWhere(cond_groups, index) {
  /*
   * NOTE: Initial value MUST be passed, otherwise reduce() WILL NOT run the callback on
   * the first element of the array.
   */
  let where = cond_groups.reduce((sql, cond_group, i) => {
    let conds = cond_group.conds.reduce((sql, cond, i) => {
      let { table, field, op, join } = cond;
      let values = Array.from(Array(cond.count), () => '$' + index.next).join(', ');
      let rule = table ? `(${table}.${field} ${op} (${values}))` : `(${field} ${op} (${values}))`;

      return sql + (i == 0 ? rule : ` ${join} ${rule}`);
    }, '');

    return i == 0 ? conds : ` ${cond_group.join} ${conds}`;
  }, '');

  return where;
}

module.exports = { Counter, compileWhere };
