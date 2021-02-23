export function isPreflight (req) {
  if (!req.method === 'OPTIONS') {
    return false
  }

  const requiredHeaders = [
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method',
    'Origin'
  ]

  return requiredHeaders.every(header => req.get(header))
}

export function allowOrigin (config) {
  const allowedOrigins = new Set(config.origins || [])

  return function (req, res, next) {
    const origin = req.get('Origin')

    if (origin && allowedOrigins.has(origin)) {
      res.set('Access-Control-Allow-Origin', origin)
    } else {
      console.warn(`Request from origin '${origin}' not cleared.`)
    }

    next()
  }
}

export function handlePreflight (config) {
  return function (req, res, next) {
    // console.info('Request')
    // console.info(`Method: ${req.method}`)
    // console.info(`Path: ${req.path}`)
    // console.info(`Origin: ${req.get('Origin')}`)

    if (isPreflight(req)) {
      // const origin = req.get('Origin')
      // console.log(`PREFLIGHT FROM: ${origin}`)
    }

    next()
  }
}
