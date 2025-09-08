const RedisClient = require('ioredis');

class RedisManager {
    constructor() {
        this.port = process.env.REDIS_PORT
        this.host = process.env.REDIS_HOST
        this.db = process.env.REDIS_DB ?? 0
        this.pwd = process.env.REDIS_PWD
        this.redis_url = `redis://:${this.pwd ?? ''}@${this.host}:${this.port}/${this.db}`
        this.connection = new RedisClient(
            this.redis_url,
            {maxRetriesPerRequest: null}
        )
    }
}

const redis_manager = new RedisManager()

module.exports = {
    redis_manager
}