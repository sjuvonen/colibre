const knex = require('knex');
const { assign } = require('@colibre/collections');
const { EntityBase, EntityManager } = require('./lib/entity-manager');

class Database {
  constructor(db) {
    this.db = db;
  }

  async insert(table, ...args) {
    let conn = await this.db;
    return conn[table].insert(...args);
  }

  async save(table, ...args) {
    let conn = await this.db;
    return conn[table].save(...args);
  }

  async find(table, ...args) {
    let conn = await this.db;
    return conn[table].find(...args);
  }

  async findOne(table, ...args) {
    let conn = await this.db;
    return conn[table].findOne(...args);
  }

  async count(table, ...args) {
    let conn = await this.db;
    return conn[table].count(...args);
  }

  /**
   * For custom WHERE clauses.
   */
  async where(table, ...args) {
    let conn = await this.db;
    return conn[table].where(...args);
  }

  /**
   * Perform a full-text search.
   */
  async search(table, ...args) {
    let conn = await this.db;
    return conn[table].search(...args);
  }
}

function configure(services) {
  console.log('configure orm');

  services.registerFactory('database', async () => {
    const config = services.get('config').getConfig('database');
    const options = assign({}, config.__data);
    
    return knex({
      client: 'pg',
      connection: options
    });
  });

  services.registerFactory('entity.manager', () => {
    const database = services.get('database');
    return new EntityManager(database);
  });
};

module.exports = { configure, Database, EntityBase, EntityManager };
