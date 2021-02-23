import { Kernel, Registry } from '@colibre/core'

export class ScheduledTasks {
  #running = false
  #scheduler = new Scheduler()
  #kernel
  #registry

  constructor (config) {
    this.#kernel = new Kernel(config)
    this.#registry = new Registry({ parent: this.#kernel.services, caching: false })

    this.#kernel.services.get('events').addListener('extension.load', this.onLoadExtension.bind(this))
  }

  async start () {
    if (!this.#kernel.running) {
      await this.#kernel.start()
    }

    if (this.#running || !this.#scheduler.hasTasks()) {
      return false
    }

    this.#running = true

    while (this.#running) {
      await this.#scheduler.next(async (Task) => {
        const instance = this.#registry.get(Task)
        await instance.execute()

        console.info(`Task ${Task.name} finished at`, new Date())
      })
    }
  }

  running () {
    return this.#running
  }

  enqueue (Task, interval) {
    this.#scheduler.add(new Entry(Task, interval * 1000))

    this.start()
  }

  onLoadExtension (Extension) {
    if (!Array.isArray(Extension.tasks)) {
      return
    }

    for (const { task, interval } of Extension.tasks) {
      this.#registry.register(task)
      this.enqueue(task, interval)
    }
  }
}

class Scheduler {
  #entries = []

  hasTasks () {
    return this.#entries.length > 0
  }

  add (entry) {
    this.#entries.push(entry)
  }

  next (callback) {
    return new Promise((resolve, reject) => {
      if (!this.#entries.length) {
        return reject(new Error('No jobs!'))
      }

      async function wait () {
        await callback(entry.task)
        entry.nextTurn = Date.now() + entry.interval
        resolve()
      }

      this.#entries.sort((a, b) => a.nextTurn - b.nextTurn)
      const entry = this.#entries[0]

      setTimeout(wait.bind(null, entry), Math.max(entry.nextTurn - Date.now(), 0))
    })
  }
}

class Entry {
  #task
  #interval

  constructor (Task, interval) {
    this.#task = Task
    this.#interval = interval
    this.nextTurn = 0
  }

  get task () {
    return this.#task
  }

  get interval () {
    return this.#interval
  }
}
