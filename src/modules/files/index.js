"use strict";

let fs = require("fs");
let mime = require("mime-types");
let mongoose = require("mongoose");
let multer = require("multer");
let util = require("util");

let FileSchema = new mongoose.Schema({
  name: String,
  path: String,
  size: Number,
  mime: String,
  owner: {
    type: "String",
    ref: "User"
  },

  // Tags for links files semantically to a specific module or purpose.
  tags: [String],

  // Usage tags for tracking where a specific file is used and when it becomes obsolete.
  usage: [String],

  meta: {
    created: {
      type: Date,
      default: Date.now
    }
  },
});

FileSchema.pre("save", function(next) {
  if (this.isNew) {
    fs.stat(this.path, (error, stats) => {
      if (error) {
        return next(error);
      }
      this.size = stats.size;
      this.mime = mime.lookup(this.path) || null;
      next();
    });
  } else {
    next();
  }
});

mongoose.model("file", FileSchema);

class FileManager {
  constructor(options) {
    Object.defineProperty(this, "meta", {
      value: Object.create(null),
    });
    this.meta.options = options;
  }

  fromFile(path) {

  }
}

exports.configure = services => {
  let upload_dir = services.get("config").get("storage.uploads.path");
  let upload = multer({storage: multer.diskStorage({
    destination: (req, file, done) => done(null, upload_dir),
    filename: (req, file, done) => done(null, util.format("%s-%s", Date.now(), file.originalname))
  })});

  services.get("event.manager").on("app.ready", event => {
    services.get("module.manager").modules.forEach(module => {
      let routes = module.config.get("routes") || [];

      routes.forEach(route => {
        if ("options" in route && "multipart" in route.options) {
          let options = route.options.multipart;
          let field = options.single || options.multiple;
          let middleware = options.single ? upload.single(field) : upload.array(field);

          event.app.baseApp.post(route.path, middleware);

          event.app.use(route.path, event => {
            let fdata = event.request.uploadInfo(field);
            if (fdata) {
              let File = mongoose.model("file");
              let file = new File({
                name: fdata.filename,
                path: fdata.path,
                mime: fdata.mimetype,
                size: fdata.size,
                owner: event.identity.id,
              });

              if (!("files" in event.request)) {
                event.request.files = new Map;
              }

              event.request.files.set(field, file);
            }
          });
        }
      });
    });
  });
};
