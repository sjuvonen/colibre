/**
 * Allows listening to other event emitters indirectly.
 */
class SharedEmitter {
  /**
   * @param emitter The EventEmitter that will be used as the base emitter for this emitter.
   */
  constructor(emitter) {
    if (!emitter || typeof emitter != 'object') {
      throw new Error('Need an event emitter');
    }
    this.__inner = emitter;
    this.__emitters = new Map;
  }

  addEmitter(name, emitter) {
    // this.__emitters.push({name: name, emitter: emitter});
    this.__emitters.set(name, emitter);
    emitter.on('*', (event, args) => this.__onEvent(emitter, event, args));
  }

  on(event, callback) {
    this.__inner.on(...arguments);
    return this;
  }

  emit(event) {
    return this.__inner.emit(...arguments);
  }

  __onEvent(emitter, event, args) {
    let emitter_id = this.__nameForEmitter(emitter);
    let global_event = emitter_id + '.' + event;
    let all_args = [global_event].concat(args);
    return this.__inner.emit.apply(this.__inner, all_args);
  }

  __nameForEmitter(emitter) {
    for (let [eid, e] of this.__emitters.entries()) {
      if (emitter == e) {
        return eid;
      }
    }
    throw new Error(`Emitter '${emitter}' not registered`);
  }
}

module.exports = SharedEmitter;
