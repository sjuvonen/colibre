class EventEmitter {
  constructor() {
    this.__listeners = new Map;
  }

  on(event_id, listener) {
    this.addListener(event_id, listener);
  }

  once(event_id, listener) {
    this.addListener(event_id, listener, true);
  }

  addListener(event_id, listener, once) {
    const item = [listener, once];

    if (this.__listeners.has(event_id)) {
      this.__listeners.get(event_id).push(item);
    } else {
      this.__listeners.set(event_id, [item]);
    }
  }

  off(event_id, listener) {
    const listeners = this.__listeners.get(event_id);
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listener == listeners[i]) {
        listeners.splice(i, 1);
      }
    }
  }

  emit(event_id, ...args) {
    if (this.__listeners.has(event_id)) {
      const listeners = this.__listeners.get(event_id);
      for (let i = 0; i < listeners.length; i++) {
        const func = listeners[i][0];

        if (listeners[i][1]) {
          listeners.splice(i, 1);
          i--;
        }

        func(...args);
      }
    }

    if (event_id != "*") {
      this.emit("*", event_id, ...args);
    }
  }
}

module.exports = EventEmitter;
