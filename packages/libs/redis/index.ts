import Redis from 'ioredis'

function createRedisClient() {
  if (process.env.REDIS_URL) {
    // URL version (recommended for Upstash)
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  }

  // Host/Port version (fallback)
  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    username: 'default',
    tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  })
}

const redis = createRedisClient()

redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('error', (err) => {
  console.log('Redis error:', err.message)
})

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...')
})

export default redis