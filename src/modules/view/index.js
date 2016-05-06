"use strict";

let fs = require("fs");
let util = require("util");
let AsyncEventManager = require("../../events").AsyncEventManager;
let HttpEventDecorator = require("../../util").HttpEventDecorator;

class ViewData {
  constructor(template, variables) {
    this.template = template;
    this.variables = variables || {};
  }

  get(variable) {
    return this.variables[variable];
  }
}

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

class ViewEvent extends HttpEventDecorator {
  constructor(http_event, view) {
    super(http_event);
    this.view = view;
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
      try {
        // NOTE: Twig crashes without these two variables!
        variables.views = "";
        variables.settings = {};

        this.twig.renderFile(file, variables, (error, data) => {
          error ? reject(error) : resolve(data);
        });
    } catch (error) { console.error(error.stack)}
    });
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
      let view_event = new ViewEvent(http_event, this);
      return this.events.emit("render", view_event);
    }
  }

  onRender(view_event) {
    let variables = view_event.variables;
    return this.render(view_event.template, view_event.variables).then(rendered => {
      view_event.data = rendered;
    });
  }

  render(file, variables) {
    let template = this.templates.map(file);
    let subs = Object.keys(variables).map(key => {
      let value = variables[key];
      if (value instanceof ViewData) {
        return this.render(value.template, value.variables).then(result => {
          variables[key] = result;
        }, error => {
          console.log("view.onRender", error.stack);
        });
      }
    });
    return Promise.all(subs).then(() => this.renderer.render(template, variables));
  }
}

exports.View = View;
exports.ViewData = ViewData;

exports.configure = services => {
  let events = services.get("event.manager");
  let view = new View;

  services.register("view", view);
  events.addEmitter("view", view.events);

  events.on("app.response", event => view.onResponse(event));

  events.on("modules.load", module => {
    view.templates.addPath(module.name, module.path + "/views");
  });

  view.templates.addPath("core", __dirname + "/../../../views");
};
