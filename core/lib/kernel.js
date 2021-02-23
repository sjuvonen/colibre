import { EventEmitter } from 'events'
import { ExtensionManager } from './extensions.js'
import { Registry } from './services.js'

export class Kernel {
  #events = new EventEmitter()
  #services = new Registry()
  #extensions
  #running = false
  #config
  #id

  constructor (config) {
    this.#config = config

    this.#services.registerInstance('config', this.#config)
    this.#services.registerInstance('extensions', this.extensions)
    this.#services.registerInstance('events', this.events)

    this.#extensions = new ExtensionManager(this.#services)
  }

  get config () {
    return this.#config
  }

  get running () {
    return this.#running
  }

  get services () {
    return this.#services
  }

  get events () {
    return this.#events
  }

  get extensions () {
    return this.#extensions
  }

  start () {
    if (this.running) {
      return false
    }

    this.#running = true
    this.#id = setInterval(() => null, 10000)

    if (this.config.extensions) {
      this.config.extensions.map(e => this.extensions.add(e))
    }

    console.info('kernel started')
  }

  stop () {
    if (!this.running) {
      return false
    }

    clearInterval(this.#id)
    this.#running = false

    console.info('Kernel stopped')
  }
}
