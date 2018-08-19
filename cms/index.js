const pathlib = require('path');
const { Server } = require('@colibre/core');
const { Renderer, Renderable } = require('./view');

const ormExtension = require('@colibre/orm');
const userExtension = require('./ext/user');
const contentExtension = require('./ext/content');
const themeExtension = require('./ext/theme');

function setupExtension(services, extension, path) {
  const router = services.get('router');
  const renderer = services.get('renderer');

  renderer.setPath(pathlib.basename(path), path + '/templates');

  if (extension.controllers) {
    for (let controller of Object.values(extension.controllers)) {
      if ('configure' in controller) {
        controller.configure(services);
      }
    }
  }

  if (extension.routes) {
    for (let route of extension.routes) {
      if ('controller' in route) {
        let [con_id, func_id] = route.controller.split(/\./);
        let controller = extension.controllers[con_id];
        let func = controller[func_id];

        route.callback = (request, response) => func(request, processControllerResult);

        router.add(route);
      }
    }
  }
}

function processControllerResult(template_id, variables) {
  try {
    if (typeof template_id == 'string') {
      return new Renderable(template_id, variables);
    } else if (typeof template_id == 'object' && typeof variables == 'undefined') {
      // Response is JSON data, pass it unprocessed.
      return template_id;
    } else {
      throw new Error('Controller returned an invalid result');
    }
  } catch (error) {
    console.error(error.stack);
  }
}

class CMS {
  constructor(options) {
    const extensions = [
      require.resolve('@colibre/orm'),
      '@colibre/cms/ext/theme',
      '@colibre/cms/ext/user',
      '@colibre/cms/ext/content',
    ];

    options.extensions = extensions.concat(options.extensions);

    this.__server = new Server(options);
    this.__view = new Renderer;

    this.events.on('kernel.boot', () => this.onBoot());
    this.events.on('kernel.request', (event) => this.onRequest(event));
    this.events.on('kernel.response', (event) => this.onResponse(event));
    this.events.on('kernel.listen', (event) => this.onListen(event));

    // this.services.registerFactory('database', openDatabase);
    this.services.register('renderer', this.__view);

    this.services.get('express').use((req, res, next) => this.viewMiddleware(req, res, next));
  }

  get server() {
    return this.__server;
  }

  get services() {
    return this.server.services;
  }

  get events() {
    return this.server.services.get('events');
  }

  get renderer() {
    return this.__view;
  }

  start() {
    return this.server.start();
  }

  async onBoot() {
    const services = this.services;
    const router = services.get('router');
    const extensions = services.get('extensions').enabledExtensions;

    for (let [path, ext] of extensions) {
      setupExtension(services, ext, path);
    }
  }

  onListen() {
    // this.services.get('express').use((req, res, next) => this.viewMiddleware(req, res, next));
  }

  async onRequest(event) {
    // console.log('cms.onRequest');
  }

  async onResponse(event) {
    // console.log('cms.onResponse');
  }

  async viewMiddleware(req, res, next) {
    console.log('view middleware');
    try {
      if (res.locals.result instanceof Renderable) {
        let renderable = res.locals.result;
        let markup = await this.renderer.render(renderable.template, renderable.variables);
        res.locals.result = markup;
      }
      next();
    } catch (error) {
      next(error);
    }
  }
}

function run(options) {
  const cms = new CMS(options);
  return cms.start();
}

module.exports = { CMS, run };
