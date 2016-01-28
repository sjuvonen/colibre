"use strict";

let Block = require("../blocks").Block;

class MenuBlock extends Block {
  constructor(id) {
    super("menu." + id);

    this.links = [
      {name: "Home", url: "/"}
    ];
  }

  render(view) {
    return view.render("menu/navbar", {links: this.links});
  }
}

exports.configure = services => {
  let blocks = services.get("block.manager");

  blocks.registerFactory("menu", (id) => {
    return new MenuBlock(id);
  });

  services.get("event.manager").on("app.request", event => {
    event.locals.blocks.get("header").set("main_menu", blocks.create("menu", "main"));
  });
};
