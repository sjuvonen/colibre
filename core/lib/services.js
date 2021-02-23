export function defaultFactory (Service, services) {
  function configure (instance) {
    if (typeof instance.configure === 'function') {
      instance.configure(services)
    }

    return instance
  }

  if (Array.isArray(Service.requirements)) {
    const args = Service.requirements.map(sid => services.get(sid))
    return configure(new Service(...args))
  } else {
    return configure(new Service())
  }
}

export class Registry {
  #factories = new Map()
  #instances = new Map()
  #caching
  #parent

  get [Symbol.toStringTag] () {
    const size = new Set([...this.#factories.keys(), ...this.#instances.keys()]).size
    return `size: ${size}`
  }

  constructor (config = {}) {
    this.#caching = config.caching || true
    this.#parent = config.parent || this
  }

  has (sid) {
    return this.#factories.has(sid) || this.#instances.has(sid)
  }

  get (sid) {
    if (this.#instances.has(sid)) {
      return this.#instances.get(sid)
    }

    if (this.#factories.has(sid)) {
      const instance = this.#factories.get(sid)(this.#parent)

      if (this.#caching) {
        this.#instances.set(sid, instance)
      }

      return instance
    } else {
      throw new Error(`Requested unknown service '${sid}'.`)
    }
  }

  registerInstance (sid, instance) {
    this.#instances.set(sid, instance)

    return this
  }

  register (sid, factory = null) {
    if (typeof sid === 'function' && factory === null) {
      factory = sid
    }

    console.log('F', sid, factory)

    if (factory.toString().substring(0, 5) === 'class') {
      this.#factories.set(sid, defaultFactory.bind(null, factory))
    } else {
      this.#factories.set(sid, factory)
    }

    return this
  }
}
