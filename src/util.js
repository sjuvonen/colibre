"use strict";

let datatree = require("./util/datatree");

/**
 * Base class for other events that require access to HttpEvent
 */
class HttpEventDecorator {
  constructor(http_event) {
    this.httpEvent = http_event;
  }

  redirect(...args) {
    return this.httpEvent.redirect(...args);
  }

  get request() {
    return this.httpEvent.request;
  }

  get response() {
    return this.httpEvent.response;
  }

  get locals() {
    return this.httpEvent.locals;
  }

  get identity() {
    return this.httpEvent.identity;
  }

  get data() {
    return this.response.data;
  }

  set data(data) {
    this.response.data = data;
  }
}

exports.HttpEventDecorator = HttpEventDecorator;

/*
 * Bind a function to a context.
 */
exports.proxy = (callback, context) => (...args) => callback.apply(context, args);

/*
 * Compatibility layer for Connect-style middleware.
 */
exports.fromConnect = middleware => {
  return event => {
    let req = event.request._raw;
    let res = event.response._raw;
    return new Promise(resolve => middleware(req, res, resolve));
  };
};

/**
 * Convert any return value to a Promise.
 */
exports.promisify = value => value instanceof Promise ? value : Promise.resolve(value);

/**
 * Shallow copy objects
 */
exports.copy = object => {
  let copy = Object.create(object.prototype || null);
  Object.keys(object).forEach(key => {
    if (object.hasOwnProperty(key)) {
      copy[key] = object[key];
    }
  });
  return copy;
};

exports.get = datatree.get;
exports.set = datatree.set;

/**
 * Run passed callbacks one by one, waiting for each callback to finish before proceeding.
 */
exports.iterateCallbacks = (callbacks, validate) => {
  return new Promise((resolve, reject) => {
    let i = 0;
    let next = (value) => {
      if (i < callbacks.length) {
        let func = callbacks[i++];
        Promise.resolve(func(value)).then(value => {
          if (validate && validate(value) != true) {
            return resolve(value);
          }
          next(value);
        }, reject);
      } else {
        resolve(value);
      }
    };
    next();
  });
};
