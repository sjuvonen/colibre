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

    this.#events.on('extension.load', this.onLoadExtension.bind(this))
  }

  add (Extension) {
    if (this.#registry.has(Extension)) {
      return false
    }

    if (Extension.services) {
      for (const [sid, Service] of extract(Extension.services)) {
        console.log('SIX', sid)
        this.#services.register(sid, Service)
      }
    }

    this.#registry.register(Extension).get(Extension)

    setTimeout(() => this.#events.emit('extension.load', Extension), 1000)
  }

  onLoadExtension (Extension) {
    if (Extension.configure) {
      Extension.configure(this.#services)
    }

    if (Extension.listeners) {
      setTimeout(() => this.configureListeners(Extension.listeners), 2000)
    }
  }

  configureListeners (listeners) {
    for (const [sid, events] of extract(listeners)) {
      for (const [eid, callbackName] of events) {
        this.#events.on(eid, (...args) => {
          const listener = this.#services.get(sid)

          if (callbackName in listener) {
            listener[callbackName].apply(listener, args)
          } else {
            console.error(`Invalid event listener '${sid}.${callbackName}'.`)
          }
        })
      }
    }
  }
}
