"use strict";

let util = require("util");
let Block = require("../blocks").Block;

class MenuBlock extends Block {
  constructor(id, options) {
    super("menu." + id, options);
    this.links = [];

    if (!this.options.classes) {
      this.options.classes = [];
    }
  }

  render(view) {
    return view.render(this.style, {
      id: this.id.replace(/\./g, "-"),
      options: this.options,
      links: this.links
    });
  }

  get style() {
    return this.options.style || "menu/nav";
  }
}

exports.configure = services => {
  let blocks = services.get("block.manager");

  blocks.registerFactory("menu", (id, options) => {
    return new MenuBlock(id, options);
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
