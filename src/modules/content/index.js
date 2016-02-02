"use strict";

let mongoose = require("mongoose");

let PageSchema = new mongoose.Schema({
  title: String,
  body: String,
  meta: {
    created: Date,
    modified: Date,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  }
});

mongoose.model("page", PageSchema);

exports.configure = services => {
  let blocks = services.get("block.manager");
  blocks.registerFactory("admin-content-tabs", options => {
    let tabs = blocks.create("menu", "admin.content", options);
    tabs.links.push({
      name: "List",
      route: "content.list"
    });
    tabs.links.push({
      name: "Create",
      route: "content.new"
    });
    return tabs;
  });

  services.get("form.manager").registerFactory("page.edit", () => {
    return services.get("form.builder").create("content-edit", [
      {
        name: "title",
        type: "text",
        options: {
          label: "Title",
        },
        attributes: {
          placeholder: "Title for the page",
          id: "input-title"
        }
      },
      {
        name: "body",
        type: "text",
        options: {
          label: "Body",
          widget: "textarea"
        },
        attributes: {
          id: "input-body",
          class: ["richtext"],
          placeholder: "Lorem ipsum dolor sit amet",
          rows: 15,
        }
      },
      {
        name: "actions",
        type: "actions",
        options: {
          submit: true,
          reset: true,
        }
      }
    ]);
  });

  services.get("event.manager").on("app.request", event => {
    if (event.identity.admin) {
      event.locals.blocks.getBlock("admin_menu").links.push({
        name: "Content",
        route: "content.list"
      });
    }
  });

  services.get("app").events.on("route", event => {
    if (event.identity.admin) {
      if (event.route.name.match(/^content\./)) {
        let tabs = blocks.create("admin-content-tabs", {
          // style: "menu/tabs"
          classes: ["nav-tabs"]
        });
        event.locals.blocks.get("content_top").set("admin_content_tabs", tabs);
      }
      if (event.route.name == "content.edit") {
        event.locals.blocks.getBlock("admin_content_tabs").links.push({
          name: "Edit",
          route: "content.edit",
          params: {id: event.params.page.id}
        });
      }
    }
  });
};
