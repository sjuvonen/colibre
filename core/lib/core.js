const express = require('express');
const bodyParser = require('body-parser');
const { getPath, toMap } = require('@colibre/collections');
const { ExtensionManager } = require('@colibre/extensions');
const { EventEmitter, SharedEmitter } = require('@colibre/events');
const { Router } = require('@colibre/router');
const { ServiceManager } = require('@colibre/services');

const DEFAULT_ADDR = 'localhost';
const DEFAULT_PORT = 8000;

class Config {
  constructor(values) {
    this.__data = values;
  }

  set(path, value) {

  }

  get(path) {
    return getPath(this.__data, path);
  }

  getConfig(path) {
    return new Config(this.get(path));
  }
}

class Kernel {
  constructor(options) {
    const defaults = {
      extensions: [],
    };

    this.__options = toMap(defaults, options || {});
    this.__extensions = new ExtensionManager;
    this.__services = new ServiceManager;
    this.__events = new EventEmitter;

    const shared_events = new SharedEmitter(new EventEmitter);

    shared_events.addEmitter('kernel', this.events);
    shared_events.addEmitter('extension', this.extensions.events);

    this.services.register('config', new Config(this.__options));
    this.services.register('events', shared_events);
    this.services.register('extensions', this.extensions);

    this.extensions.events.on('load', (event) => this.onExtensionLoad(event));
  }

  get events() {
    return this.__events;
  }

  get extensions() {
    return this.__extensions;
  }

  get services() {
    return this.__services;
  }

  async start() {
    for (let extension of this.__options.get('extensions')) {
      if (typeof extension == 'string') {
        extension = { path: extension };
      }
      this.extensions.load(extension.path, extension);
    }

    this.events.emit('boot');
  }

  onExtensionLoad(event) {
    if ('configure' in event.extension) {
      event.extension.configure(this.services);
    }
  }
}

/**
 * Allows a priority lane for express.static handlers added by Colibre extensions, so that
 * we can properly serve static files provided by these extensions.
 */
class StaticFiles {
  constructor(express) {
    this.express = express;
    this.handlers = [];
  }

  use(path, handler) {
    this.handlers.push({
      prefix: path,
      callback: handler,
    });

    this.handlers.sort((a, b) => {
      return b.prefix.localeCompare(a.prefix);
    });
  }

  get middleware() {
    return (req, res, done) => {
      let i = -1;
      const handlers = this.handlers;

      nextHandler();

      function nextHandler(error) {
        i++;
        if (!error && i < handlers.length) {
          let handler = handlers[i];

          if (req.path.indexOf(handler.prefix) == 0) {
            // NOTE: This variables controls how serve-static processes request paths.
            req.url = req.path.substr(handler.prefix.length);

            handler.callback(req, res, nextHandler);
          } else {
            nextHandler();
          }
        } else {
          done(error);
        }
      }
    };
  }
}

class Server {
  constructor(options) {
    this.__options = toMap(options || {});
    this.__kernel = new Kernel(this.__options);
    this.__router = new Router;
    this.__app = express();

    const static_files = new StaticFiles(express);

    static_files.use('web', express.static('web'));

    this.services.register('express', this.__app);
    this.services.register('router', this.router);
    this.services.register('middleware.static', express.static);
    this.services.register('static_files', static_files);

    this.__app.use(bodyParser.urlencoded({ extended: true }));
    this.__app.use(static_files.middleware);
    this.__app.use((req, res, next) => this.onRequest(req, res, next));
  }

  get events() {
    return this.kernel.events;
  }

  get kernel() {
    return this.__kernel;
  }

  get services() {
    return this.__kernel.services;
  }

  get router() {
    return this.__router;
  }

  use(middleware) {
    this.__app.use(middleware);
  }

  async start(addr, port) {
    return this.kernel.start().then(() => new Promise((resolve, reject) => {
      let baddr = addr || DEFAULT_ADDR;
      let bport = port || DEFAULT_PORT;

      // this.__app.use((req, res, next) => this.onRequest(req, res, next));
      // this.__app.use((req, res, next) => this.onResponse(req, res, next));

      this.__app.listen(bport, baddr, (error) => {
        if (error) {
          return reject(error);
        }

        resolve([baddr, bport]);

        this.events.emit('listen');
        this.__app.use((req, res, next) => this.onResponse(req, res, next));
      });
    }));
  }

  stop() {
    this.__app.close();
  }

  async onRequest(req, res, next) {
    const request = new Request(req);
    const response = new Response(res);

    let match = this.router.match(request.path, request);

    if (match) {
      try {
        const callback = match.params.get('_callback');
        const result = await callback(match);

        res.locals.result = result;

        this.events.emit('request', {
          routeMatch: match,
          result: result,
        });
        return next();
      } catch (error) {
        return next(error);
      }
    } else {
      res.status(404).send('Not Found');
      // next();
    }
  }

  async onResponse(req, res, next) {
    try {
      // this.events.emit('response', { request, response });
      this.events.emit('response');

      if (res.locals.result) {
        res.send(res.locals.result);
      }
    } catch (error) {
      console.error(error);
    }

    next();
  }
}

class Request {
  constructor(context) {
    this.__context = context;
  }

  get context() {
    return this.__context;
  }

  get path() {
    return this.__context.path;
  }

  get body() {
    return this.__context.body;
  }
}

class Response {
  constructor(context) {
    this.__context = context;
  }

  get context() {
    return this.__context;
  }

  get locals() {
    return this.__context.locals;
  }
}

module.exports = { Server };
