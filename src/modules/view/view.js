"use strict";

let util = require("util");
let AsyncEventManager = require("../../events").AsyncEventManager;

class TemplateMap {
  constructor() {
    this.paths = new Map;
  }

  addPath(path_id, path) {
    this.paths.set(path_id, path);
  }

  map(path) {
    if (this.paths.has(path)) {
      return this.paths.get(path) + ".html";
    }
    let parts = path.split("/");
    let module_id = parts.shift();
    if (this.paths.has(module_id)) {
      return util.format("%s/%s.html", this.paths.get(module_id), parts.join("/"));
    } else {
      return path + ".html";
    }
  }
}

class ViewEvent {
  constructor(view, http_event) {
    this.view = view;
    this.httpEvent = http_event;
  }

  get data() {
    return this.httpEvent.data;
  }

  set data(data) {
    this.httpEvent.data = data;
  }

  get locals() {
    return this.httpEvent.locals;
  }

  get response() {
    return this.httpEvent.response;
  }

  get variables() {
    return this.data.variables;
  }

  get template() {
    return this.data.template;
  }

  set template(template) {
    this.data.template = template;
  }
}

class TwigRenderer {
  constructor() {
    this.twig = require("twig");
  }

  render(file, variables) {
    return new Promise((resolve, reject) => {
      this.twig.renderFile(file, variables, (error, data) => {
        error ? reject(error) : resolve(data);
      });
    });
  }
}

class ViewData {
  constructor(template, variables) {
    this.template = template;
    this.variables = variables || {};
  }
}

class View {
  constructor() {
    this.events = new AsyncEventManager;
    this.events.on("render", event => this.onRender(event));
    this.renderer = new TwigRenderer;
    this.templates = new TemplateMap;
  }

  /**
   * @param http_event HttpEvent
   */
  onResponse(http_event) {
    if (http_event.data instanceof ViewData) {
      let view_event = new ViewEvent(this, http_event);
      return this.events.emit("render", view_event);
    }
  }

  onRender(view_event) {
    let variables = view_event.variables;
    let subs = Object.keys(variables).map(key => {
      let value = variables[key];
      if (value instanceof ViewData) {
        return this.render(value.template, value.variables).then(result => {
          variables[key] = result;
        });
      }
    });

    return Promise.all(subs).then(() => this.render(view_event.template, variables).then(rendered => {
      view_event.data = rendered;
      return rendered;
    }));
  }

  render(file, variables) {
    let template = this.templates.map(file);
    return this.renderer.render(template, variables);
  }
}

exports.View = View;
exports.ViewData = ViewData;
