"use strict";

exports.configure = services => {
  let blocks = services.get("block.manager");

  blocks.registerFactory("admin-menu", options => {
    return blocks.create("menu", "admin", options);
  });

  services.get("event.manager").on("app.request", event => {
    if (event.identity.admin) {
      let menu = blocks.create("admin-menu", {
        style: "menu/navbar",
        fixedToTop: true,
        classes: ["admin-toolbar", "navbar-dark", "bg-inverse"]
      });
      event.locals.blocks.get("page_top").set("admin_menu", menu);
    }
  });
};
