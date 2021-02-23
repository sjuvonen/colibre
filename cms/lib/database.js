import { factory } from './postgres.js'

export class Database {
  static requirements = ['config']

  #pool

  constructor (config) {
    this.#pool = factory(config)
  }

  get pool () {
    return this.#pool
  }

  query (query, parameters = []) {
    query = convertQueryPlaceholders(query, parameters)
    return this.pool.query(query, parameters).then((result) => result.rows)
  }
}

function convertQueryPlaceholders (query, parameters) {
  if (Array.isArray(parameters)) {
    let i = 0
    return query.toString().replace(/\?/g, () => `$${++i}`)
  } else if (parameters) {
    throw new Error('Only array-like parameter definitions are supported for now')
  }
}
