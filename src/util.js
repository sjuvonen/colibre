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
