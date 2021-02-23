import pg from 'pg'

export function factory (config) {
  const defaults = {
    user: null,
    host: null,
    port: null,
    database: null
  }

  return new pg.Pool(Object.assign({}, defaults, config))
}
