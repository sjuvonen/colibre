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

class BaseLinkManager {
  constructor() {
    this.links = new Map;
  }

  addLinks(links) {
    links.forEach(link => this.add(link));
  }

  add(link) {
    throw new Error("BaseLinkManager.add() not implemented");
  }
}

class LinkManager extends BaseLinkManager {
  constructor(router) {
    super();
    this.router = router;
  }

  add(link) {
    if (!this.links.has(link.parent)) {
      this.links.set(link.parent, []);
    }
    this.links.get(link.parent).push(link);
  }

  linksForPath(path) {
    return this.router.match(path, "get").then(match => {
      if (this.links.has(match.route.name)) {
        return new LinkCollection(match, this.links.get(match.route.name));
      }
    });
  }
}

class MenuLinkManager extends BaseLinkManager {
  add(link) {
    if (!this.links.has(link.menu)) {
      this.links.set(link.menu, []);
    }
    this.links.get(link.menu).push(link);
  }

  linksForMenu(name) {
    return this.links.get(name) || [];
  }
}

class TabLinkManager extends LinkManager {
  constructor(router) {
    super(router);
    this.reverseMap = new Map;
  }

  add(link) {
    super.add(link);
    this.reverseMap.set(link.route, link.parent);
  }

  linksForPath(path) {
    return this.router.match(path, "get").then(match => {
      let parent = this.reverseMap.get(match.route.name);
      return parent ? new LinkCollection(match, this.links.get(parent)) : null;
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
  services.register("menu.links.actions", new LinkManager(services.get("router")));
  services.register("menu.links.tabs", new TabLinkManager(services.get("router")));
  services.register("menu.links.menu", new MenuLinkManager);

  let blocks = services.get("block.manager");

  blocks.registerFactory("menu", (id, options) => {
    let block = new MenuBlock(services.get("url.builder"), id, options);
    services.get("menu.links.menu").linksForMenu(id).forEach(link => block.links.push(link));

    return block;
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
    services.get("module.manager").modules.forEach(module => {
      try {
        let links = require(module.path + "/links.tabs.json");
        services.get("menu.links.tabs").addLinks(links);
      } catch (error) {
        // pass, file does not exist
      }

      try {
        let links = require(module.path + "/links.actions.json");
        services.get("menu.links.actions").addLinks(links);
      } catch (error) {
        // pass, file does not exist
      }

      try {
        let links = require(module.path + "/links.menu.json");
        services.get("menu.links.menu").addLinks(links);
      } catch (error) {
        // pass, file does not exist
      }
    });
  });

  services.get("event.manager").on("app.request", event => {
    services.get("menu.links.tabs").linksForPath(event.request.path).then(links => {
      let block = blocks.create("menu", "tabs." + links.parent, {
        classes: ["nav-tabs"]
      });
      links.forEach(link => {
        block.links.push({
          name: link.name,
          route: link.route,
          params: links.match.params,
        });
      });
      event.locals.blocks.get("main_top").set("content_tabs", block);
    });

    services.get("menu.links.actions").linksForPath(event.request.path).then(links => {
      let block = blocks.create("menu", "actions." + links.parent, {
        style: "menu/actions",
      });
      links.forEach(link => {
        block.links.push({
          name: link.name,
          route: link.route,
          params: links.match.params,
        });
      });
      event.locals.blocks.get("content_top").set("content_actions", block);
    });
  });
};
