"use strict";

/**
 * Base class for other events that require access to HttpEvent
 */
class HttpEventDecorator {
  constructor(http_event) {
    this.httpEvent = http_event;
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
exports.promisify = value => value instanceof Promise ? value : Promise.accept(value);

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

exports.get = (data, path, default_value) => {
  let parts = path.split(".");
  let last = parts.pop();
  parts.forEach(key => {
    data = data[key] || {};
  });
  return typeof data[last] == "undefined" ? default_value : data[last];
};

exports.set = (data, path, value) => {
  let parts = path.split(".");
  let last = parts.pop();
  while (parts.length > 0) {
    let key = parts.shift();
    if (data instanceof Object && key in data) {
      data = data[key];
    } else {
      console.error('cannot read', key);
      return false;
    }
  }
  console.log("set", last, value, data);
  data[last] = value;
};
