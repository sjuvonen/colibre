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
  constructor(http_event) {
    this.httpEvent = http_event;
  }

  get data() {
    return this.httpEvent.data;
  }

  set data(data) {
    this.httpEvent.data = data;
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
    this.templates = new TemplateMap;
    this.events = new AsyncEventManager;
    this.events.on("render", event => this.onRender(event));
    this.renderer = new TwigRenderer;
  }

  /**
   * @param http_event HttpEvent
   */
  onResponse(http_event) {
    if (http_event.data instanceof ViewData) {
      let view_event = new ViewEvent(http_event);
      return this.events.emit("render", view_event);
    }
  }

  onRender(view_event) {
    let template = this.templates.map(view_event.template);
    return this.renderer.render(template, view_event.variables).then(rendered => {
      view_event.data = rendered;
      return rendered;
    });
  }
}

exports.View = View;
exports.ViewData = ViewData;
