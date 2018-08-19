const fs = require('fs');
const pathlib = require('path');
const events = require('@colibre/events');

class ExtensionManager {
  constructor() {
    this.__events = new events.EventEmitter;
    this.__loader = new Loader;
    this.__enabled = new Map;
  }

  get events() {
    return this.__events;
  }

  get enabledExtensions() {
    return this.__enabled;
  }

  load(path) {
    const [extension, ext_id] = this.__loader.load(path);
    this.enabledExtensions.set(ext_id, extension);
    this.events.emit('load', { extension });
  }
}

class Loader {
  load(path) {
    const search_paths = [path, pathlib.resolve('./node_modules/' + path)];

    for (let test of search_paths) {
      let realpath = pathlib.resolve(test);

      if (fs.existsSync(realpath)) {
        const extension = require(realpath);

        if (!('routes' in extension)) {
          try {
            extension.routes = require(`${realpath}/routes.json`);
          } catch (error) {
            // pass
          }
        }

        return [extension, realpath];
      }
    }

    throw new Error(`Could not load extension '${path}'`);
  }
}

module.exports = { ExtensionManager, Loader };
