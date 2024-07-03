const config = require("dotenv").config();
const Redis = require('ioredis');

class RedisManager {
    constructor() {
        this.port = config.parsed.REDIS_PORT
        this.host = config.parsed.REDIS_HOST
        this.db = config.parsed.REDIS_DB
        this.redis_url = `redis://${this.host}:${this.port}/${this.db}`
        this.connection = new Redis(
            this.redis_url,
            {maxRetriesPerRequest: null}
        )
    }

}

const redis_manager = new RedisManager()

module.exports = {
    redis_manager
}