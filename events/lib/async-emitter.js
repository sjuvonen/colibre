const EventEmitter = require('./event-emitter');

/**
 * Supports executing asynchonous events in serial mode.
 */
class AsyncEmitter extends EventEmitter {
  async emit(event_id, ...args) {
    const listeners = this.__listeners.get(event_id) || [];

    if (this.__listeners.has(event_id)) {
      const listeners = this.__listeners.get(event_id);

      for (let i = 0; i < listeners.length; i++) {
        let [callback, once] = listeners[i];

        if (once) {
          listeners.splice(i, 1);
          i--;
        }

        await callback(...args);
      }
    }

    if (event_id != '*') {
      await this.emit('*', event_id, ...args);
    }
  }
}

module.exports = AsyncEmitter;
