const {redis_manager} = require('@/ExpressServerEnd/DAO/Redis/RedisManager');

class UserRedisDao {
    /**
     *
     * @param signature
     * @param ttl 秒
     * @return {Promise<awaited ResultTypes<"OK", Context>[Context["type"]]>}
     */
    async add_black_list_jwt_signature({signature, ttl}) {
        return await redis_manager.connection.setex(`jwt_black_list:${signature}`, ttl, 1);
    }

    /**
     *
     * @param signature
     * @return {Promise<awaited ResultTypes<string, Context>[Context["type"]]>}
     */
    async is_jwt_signature_in_black_list({signature}) {
        return await redis_manager.connection.get(`jwt_black_list:${signature}`);
    }
}

const user_redis_dao = new UserRedisDao();
module.exports = {
    user_redis_dao
}