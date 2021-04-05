import { factory } from './postgres.js'

function camelCased (name) {
  return name.replace(/_(\w)/g, ([, char]) => char.toUpperCase())
}

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
    const payload = {
      text: convertQueryPlaceholders(query, parameters),
      values: parameters,
      rowMode: 'array'
    }

    console.log('Q', payload.text)

    return this.pool.query(payload)
      .then((result) => result.rows.map((row) => {
        const record = {}

        for (const [i, field] of result.fields.entries()) {
          record[camelCased(field.name)] = row[i]
        }

        return record
      }))
  }
}

function convertQueryPlaceholders (query, parameters) {
  if (Array.isArray(parameters)) {
    let i = 0

    return (query instanceof Object ? query.toSql() : query).replace(/\?/g, () => `$${++i}`)
  } else if (parameters) {
    throw new Error('Only array-like parameter definitions are supported for now')
  }
}
