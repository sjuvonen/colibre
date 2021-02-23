import rxjs from 'rxjs'

export class Emitter extends rxjs.Subject {
  emit (value) {
    return this.next(value)
  }
}

export class Dispatcher {
  #emitters = new Map()

  register (type, emitter) {
    this.#emitters.set(type, emitter)
  }

  addListener (type, listener) {
    if (!this.#emitters.has(type)) {
      this.#emitters.set(type, new Emitter())
    }

    return this.#emitters.get(type).subscribe(listener)
  }

  dispatch (event) {
    const type = Object.getPrototypeOf(event).constructor
    const emitter = this.#emitters.get(type)

    if (emitter) {
      emitter.emit(event)
    }
  }
}
