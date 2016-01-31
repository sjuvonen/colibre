"use strict";

let express = require("express");
let util = require("util");
let ViewData = require("../view").ViewData;

exports.configure = services => {
  let theme = services.get("config").get("theme.name");
  services.get("app").baseApp.use("/themes", express.static("themes"));
  services.get("view").templates.addPath("layout", util.format("themes/%s/views/layout", theme));
  services.get("event.manager").on("view.render", event => {
    if (event.data instanceof ViewData) {
      event.data = new ViewData("layout", {
        request: event.request,
        content: event.data,
      });
    }
  });
};
