"use strict";

let View = require("./view").View;

exports.configure = services => {
  let events = services.get("event.manager");
  let view = new View;

  events.addEmitter("view", view.events);
  events.on("app.response", event => view.onResponse(event));

  events.on("modules.load", module => {
    view.templates.addPath(module.name, module.path + "/views");
  });
};
