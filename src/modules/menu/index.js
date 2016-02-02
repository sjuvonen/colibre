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

  render(view) {
    let links = this.links.map(link => {
      if (!link.url) {
        link.url = this.urlBuilder.fromRoute(link.route, link.params);
      }
      return link;
    });
    return view.render(this.style, {
      id: this.id.replace(/\./g, "-"),
      options: this.options,
      links: links
    });
  }

  get style() {
    return this.options.style || "menu/nav";
  }
}

exports.configure = services => {
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
};
