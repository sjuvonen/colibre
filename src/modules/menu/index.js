"use strict";

let util = require("util");
let Block = require("../blocks").Block;

class MenuBlock extends Block {
  constructor(url_builder, id, options) {
    super("menu." + id, options);
    this.urlBuilder = url_builder;
    this.links = [];

    if (!this.options.classes) {
      this.options.classes = [];
    }
  }

  render(view, event) {
    return view.render(this.style, {
      id: this.id.replace(/\./g, "-"),
      options: this.options,
      links: this.links.map(link => {
        if (!link.url) {
          link.url = this.urlBuilder.fromRoute(link.route, link.params);
        }
        link.active = (event.request.path == link.url);
        return link;
      })
    });
  }

  get style() {
    return this.options.style || "menu/nav";
  }
}

class LinkManager {
  constructor(router) {
    this.router = router;
    this.links = new Map;
  }

  addLinks(links) {
    links.forEach(link => {
      if (!this.links.has(link.parent)) {
        this.links.set(link.parent, []);
      }
      this.links.get(link.parent).push(link);
    });
  }

  linksForPath(path) {
    return this.router.match(path, "get").then(match => {
      if (this.links.has(match.route.name)) {
        return new LinkCollection(match, this.links.get(match.route.name));
      }
      return this.router.match(path.substring(0, path.lastIndexOf("/")), "get").then(match => {
        if (this.links.has(match.route.name)) {
          return new LinkCollection(match, this.links.get(match.route.name));
        }
      });
    });
  }
}

class LinkCollection {
  constructor(match, links) {
    this.match = match;
    this.links = links;
  }

  get parent() {
    return this.match.route.name;
  }

  forEach(callback, context) {
    return this.links.forEach(callback, context);
  }
}

exports.configure = services => {
  services.register("menu.links.tabs", new LinkManager(services.get("router")));

  let blocks = services.get("block.manager");

  blocks.registerFactory("menu", (id, options) => {
    return new MenuBlock(services.get("url.builder"), id, options);
  });

  services.get("event.manager").on("app.request", event => {
    let menu = blocks.create("menu", "main", {
      style: "menu/navbar",
      classes: ["navbar-dark bg-primary"]
    });
    menu.links.push({name: "Home", url: "/"});
    event.locals.blocks.get("header").set("main_menu", menu);
  });

  services.get("event.manager").on("app.ready", event => {
    let link_manager = services.get("menu.links.tabs");
    services.get("module.manager").modules.forEach(module => {
      try {
        let links = require(module.path + "/links.tabs.json");
        link_manager.addLinks(links);
      } catch (error) {

      }
    });
  });

  services.get("event.manager").on("app.request", event => {
    services.get("menu.links.tabs").linksForPath(event.request.path).then(links => {
      let block = blocks.create("menu", links.parent, {
        // style: "menu/navbar",
        classes: ["nav-tabs"]
      });
      links.forEach(link => {
        block.links.push({
          name: link.name,
          route: link.route,
          params: links.match.params,
        });
      });
      event.locals.blocks.get("content_top").set("content_tabs", block);
    });
  });
};
