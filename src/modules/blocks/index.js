"use strict";

let PluginManager = require("../../service-manager").PluginManager;
let cmsutil = require("../../util");

class BlockManager extends PluginManager {
  constructor() {
    super();
    this.cacheFactories = false;
  }
}

class BlockRegion extends Map {
  constructor(chain) {
    super();
    this.chain = chain;
  }

  set(id, block) {
    super.set(id, block);
    this.chain.blocks.set(id, block);
  }

  delete(id) {
    super.delete(id);
    this.chain.blocks.delete(id);
  }
}

class BlockChain {
  constructor() {
    this.regions = new Map([
      ["page_top", new BlockRegion(this)],
      ["header", new BlockRegion(this)],
      ["content_top", new BlockRegion(this)],
    ]);
    this.blocks = new Map;
  }

  getBlock(id) {
    return this.blocks.get(id);
  }

  get(region_id) {
    return this.regions.get(region_id);
  }

  forEach(...args) {
    return this.regions.forEach(...args);
  }
}

class Block {
  constructor(id, options) {
    this.id = id;
    this.options = options || {};
  }

  render(view) {
    throw new Error("Implement Block.render()");
  }
}

exports.configure = services => {
  services.register("block.manager", new BlockManager);

  services.get("app").use(event => {
    event.locals.blocks = new BlockChain;
  });

  services.get("event.manager").on("view.render", event => {
    let promises = [];
    let cache = new Map;

    event.locals.blocks.forEach((blocks, region) => {
      cache.set(region, []);
      blocks.forEach((block, key) => {
        promises.push(cmsutil.promisify(block.render(event.view)).then(rendered => {
          cache.get(region).push(rendered);
        }));
      });
    });

    return Promise.all(promises).then(() => {
      event.data.variables.blocks = {};
      cache.forEach((blocks, region) => {
        event.data.variables.blocks[region] = blocks.join("\n");
      })
    });
  });
};

exports.Block = Block;
