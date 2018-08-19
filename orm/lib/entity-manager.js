const { toMap, assign } = require('@colibre/collections');

class EntityManager {
  constructor(database) {
    this.__db = database;
    this.__types = new Map;
    this.__storages = new Map;
  }

  get database() {
    return this.__db;
  }

  addEntityType(entity_class) {
    const schema = new Schema(entity_class.schema);
    const type = new EntityType(entity_class, schema);

    this.__types.set(schema.id, type);
    this.__storages.set(schema.id, new Storage(this.database, entity_class));
  }

  storage(type_id) {
    let storage = this.__storages.get(type_id);

    if (!storage) {
      throw new Error(`Entity type '${type_id}' is not registered`);
    }

    return storage;
  }

  persist(entity) {
  }
}

class EntityBase {
  constructor() {
    Object.defineProperty(this, '__data', {
      writable: true,
      value: new Map,
    });
  }

  [Symbol.iterator]() {
    return this.__data.entries();
  }
}

class EntityType {
  constructor(entity_class, schema) {
    this.__class = entity_class;
    this.__schema = schema;
    this.__data = new WeakMap;
    this.init();
  }

  get entityClass() {
    return this.__class;
  }

  get schema() {
    return this.__schema;
  }

  init() {
    const schema = this.schema;

    Object.defineProperty(this.entityClass.prototype, Symbol.toStringTag, {
      get() {
        const id = this.id || 'unpersisted';
        return `${schema.id} #${id}`;
      }
    });

    for (let field of this.schema.fields) {
      Object.defineProperty(this.entityClass.prototype, field.name, {
        get() {
          return this.__data.get(field.name);
        },
        set(value) {
          this.__data.set(field.name, value);
        }
      });
    }
  }
}

class Schema {
  constructor(spec) {
    const base_fields = [
      {
        name: 'id',
        type: Number
      },
      {
        name: 'created',
        type: Date,
      }
    ];

    spec.fields = base_fields.concat(spec.fields);

    this.__data = toMap(spec);
  }

  get data() {
    return this.__data;
  }

  get id() {
    return this.__data.get('id');
  }

  get fields() {
    return this.__data.get('fields');
  }

  get table() {
    return this.__data.get('table');
  }
}

class Storage {
  constructor(database, entity_class) {
    this.__db = database;
    this.__type = entity_class;
    this.__schema = new Schema(entity_class.schema);
  }

  get db() {
    return this.__db;
  }

  get schema() {
    return this.__schema;
  }

  create(values) {
    let entity = new (this.__type);

    for (let field of this.schema.fields) {
      if (values.hasOwnProperty(field.name)) {
        entity.__data.set(field.name, values[field.name]);
      }
    }

    console.log('CREATE', values, entity);

    return entity;
  }

  async save(entity) {
    if (entity.id) {
      let values = assign({}, entity.__data);
      await this.db.write(this.schema.tables, values);

      console.log('UPDATED', values);

      return entity;
    } else {
      let values = assign({}, entity.__data);
      let user_data = await this.db.insert(this.schema.table, values);
      assign(entity.__data, user_data);

      console.log('INSERTED', values, user_data);

      return entity;
    }
  }

  async find(params) {
    let result = await this.db.find(this.schema.table, params);

    if (result.length > 0) {
      let entities = new Array(result.length);

      for (let [i, row] of result.entries()) {
        entities[i] = new (this.__type);
        assign(entities[i].__data, row);
      }
      return entities;
    } else {
      return [];
    }
  }

  async findOne(params) {
    let result = await this.db.findOne(this.schema.table, params);

    if (result) {
      let entity = new (this.__type);
      assign(entity.__data, result);
    }
  }

  mapToObject(row) {

  }
}

module.exports = { EntityBase, EntityManager };
