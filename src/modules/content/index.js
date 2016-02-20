"use strict";

let mongoose = require("mongoose");
let util = require("util");

let PageSchema = new mongoose.Schema({
  title: String,
  body: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  meta: {
    state: {
      type: Number,
      default: 0
    },
    created: {
      type: Date,
      default: Date.now
    },
    modified: Date,
  }
});

mongoose.model("page", PageSchema);

class EntityUrlBuilder {
  constructor(url_builder, mappings) {
    this.urlBuilder = url_builder;
    this.mappings = new Map;

    Object.keys(mappings || {}).forEach(key => {
      this.setMapping(key, mappings[key]);
    });
  }

  setMapping(entity_type, mapped_type) {
    this.mappings.set(entity_type, mapped_type);
  }

  get(entity_type, action, entity) {
    let type = this.mappings.get(entity_type) || entity_type;
    let params = entity ? {[entity_type]: entity.id} : {};
    let route_name = util.format("%s.%s", type, action);
    return this.urlBuilder.fromRoute(route_name, params);
  }
}

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
        name: "urlalias",
        type: "text",
        attributes: {
          placeholder: "Alternative URL for this page"
        },
        options: {
          label: "Alias"
        }
      },
      {
        name: "actions",
        type: "actions",
        options: {
          submit: true,
          reset: true,
        }
      },
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
          params: {page: event.params.page.id}
        });
      }
    }
  });

  services.register("url.entity", new EntityUrlBuilder(services.get("url.builder"), {
    "page": "content"
  }));
};
