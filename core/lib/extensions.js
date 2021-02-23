import { extract } from '@colibre/collections'
import { Emitter } from './events.js'
import { Registry } from './services.js'
import Rxjs from 'rxjs'

export class ExtensionManager {
  #registry
  #services
  #events

  loaded = new Emitter(new Rxjs.BehaviorSubject())

  constructor (services) {
    this.#services = services
    this.#registry = new Registry({ parent: services })
    this.#events = services.get('events')
  }

  add (Extension) {
    if (this.#registry.has(Extension)) {
      return false
    }

    if (Extension.services) {
      for (const [sid, Service] of extract(Extension.services)) {
        this.#services.register(sid, Service)
      }
    }

    this.#registry.register(Extension).get(Extension)

    setTimeout(() => this.#events.emit('extension.load', Extension), 1000)
  }
}
