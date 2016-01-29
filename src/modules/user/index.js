"use strict";

let bcrypt = require("bcrypt");
let mongoose = require("mongoose");
let Storage = require("../storage").MongoStorage;

let UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  meta: {
    created: Date,
    login: Date,
  }
});

UserSchema.statics.findByCredentials = function(username, password) {
  return new Promise((resolve, reject) => {
    this.findOne({username: username}).then(user => bcrypt.compare(password, user.password, (error, ok) => {
      ok ? resolve(user) : reject(new Error("Invalid username or password"));
    }));
  });
};

let User = mongoose.model("user", UserSchema);

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
