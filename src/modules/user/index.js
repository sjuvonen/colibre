"use strict";

exports.configure = services => {
  services.get("event.manager").on("app.request", event => {
    event.locals.blocks.getBlock("main_menu").links.push({
      name: "Login",
      url: "/login"
    });
  });

  let form_builder = services.get("form.builder");

  services.get("form.manager").registerFactory("user.login", () => form_builder.create("user-login", [
    {
      name: "username",
      type: "text",
      options: {
        label: "Username"
      }
    },
    {
      name: "password",
      type: "password",
      options: {
        label: "Password"
      }
    },
    {
      name: "submit",
      type: "button",
      options: {
        label: "Login"
      }
    }
  ]));


};
