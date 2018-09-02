const twig = require('twig');

twig.cache(false);

class Renderable {
  constructor(template_id, variables = {}) {
    this.template = template_id;
    this.variables = variables;
  }
}

class Renderer {
  constructor() {
    this.__templates = new Map;
    // this.__paths = new Map;
    this.__paths = Object.create(null);
  }

  setPath(prefix, path) {
    // this.__paths.set(prefix, path);
    this.__paths[prefix] = path;
  }

  resolve(template_id) {
    let [prefix, ...rest] = template_id.split(/\//);
    let name = rest.join('/');

    if (prefix in this.__paths) {
      let base_path = this.__paths[prefix];
      let path = `${base_path}/${name}`;
      return path;
    }
  }

  render(template, variables) {
    return new Promise((resolve, reject) => {
      let file = (this.resolve(template) || template) + '.html.twig';

      twig.renderFile(file, variables, (error, markup) => {
        error ? reject(error) : resolve(markup);
      });
    });
  }
}

module.exports = { Renderable, Renderer };
