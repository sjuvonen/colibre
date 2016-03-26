"use strict";

let express = require("express");
let fs = require("fs");
let pathutil = require("path");
let util = require("util");
let ViewData = require("../view").ViewData;

class ThemeManager {
  /**
   * @param paths Array of search paths.
   *
   * NOTE: Paths must be relative to the project root.
   */
  constructor(paths) {
    this.paths = [];
    this.themes = new Map;
    paths.forEach(path => this.discover(path));
  }

  get(name) {
    if (this.themes.has(name)) {
      return this.themes.get(name);
    }
    throw new Error(util.format("Theme '%s' does not exist", name));
  }

  discover(root) {
    if (this.paths.indexOf(root) != -1) {
      return;
    }
    this.paths.push(root);
    fs.readdirSync(root).forEach(name => {
      if (this.themes.has(name)) {
        throw new Error(util.format("Cannot register theme '%s' as it already exists", name));
      }
      let path = util.format("%s/%s", root, name);
      this.themes.set(name, new Theme(name, path));
    });
  }
}

class Theme {
  constructor(name, path) {
    this.name = name;
    this.path = path;
  }
}

exports.configure = services => {
  let app = services.get("app");
  let config = services.get("config");
  let theme = config.get("theme.name");
  let manager = new ThemeManager(["themes", pathutil.relative(app.rootPath, app.colibreRoot + "/themes")]);
  services.register("theme.manager", manager);

  for (let theme of manager.themes.values()) {
    app.baseApp.use("/" + theme.path, express.static(theme.path));
  }

  services.get("view").templates.addPath("layout", util.format("themes/%s/views/layout", theme));
  services.get("event.manager").on("view.render", event => {
    if (event.data instanceof ViewData) {
      let site_name = config.get("site_name");
      let page_title = event.data.variables.page_title || null;
      let head_title = (page_title ? util.format("%s –", page_title) : "") + site_name;
      event.data = new ViewData("layout", {
        head_title: head_title,
        page_title: page_title,
        identity: event.identity,
        content: event.data,
      });
    }
  });
};
