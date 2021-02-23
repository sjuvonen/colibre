import { Database } from './lib/database.js'

export class CmsExtension {
  static services = {
    database: factoryDatabase
  }
}

function factoryDatabase (services) {
  return new Database(services.get('config').database)
}
