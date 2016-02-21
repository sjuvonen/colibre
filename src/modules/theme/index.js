"use strict";

let express = require("express");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.configure = services => {
  let config = services.get("config");
  let theme = config.get("theme.name");
  services.get("app").baseApp.use("/themes", express.static("themes"));
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
