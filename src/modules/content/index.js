"use strict";

let mongoose = require("mongoose");

let PageSchema = new mongoose.Schema({
  title: String,
  body: String,
  meta: {
    created: Date,
    modified: Date,
  }
});

mongoose.model("page", PageSchema);

exports.configure = services => {
  let blocks = services.get("block.manager");
  blocks.registerFactory("admin-content-tabs", options => {
    return blocks.create("menu", "admin.content", options);
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
    if (event.request.identity.admin) {
      event.locals.blocks.getBlock("admin_menu").links.push({
        name: "Content",
        url: "/admin/content"
      });

      let tabs = blocks.create("admin-content-tabs", {
        // style: "menu/tabs"
        classes: ["nav-tabs"]
      });
      tabs.links.push({
        name: "List",
        url: "/admin/content"
      });
      tabs.links.push({
        name: "Create",
        url: "/admin/content/new"
      });
      event.locals.blocks.get("content_top").set("admin_content_tabs", tabs);
    }
  });
};
