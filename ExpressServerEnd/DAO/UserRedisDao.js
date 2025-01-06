const {redis_manager} = require('@/ExpressServerEnd/DAO/Redis/RedisManager');

class UserRedisDao {
    /**
     *
     * @param signature
     * @param ttl 秒
     * @return {Promise<ResultTypes<"OK", Context>[Context["type"]]>}
     */
    add_black_list_jwt_signature({signature, ttl}) {
        return redis_manager.connection.setex(`jwt_black_list:${signature}`, ttl, 1);
    }

    is_jwt_signature_in_black_list({signature}) {
        return redis_manager.connection.get(`jwt_black_list:${signature}`);
    }
}

const user_redis_dao = new UserRedisDao();
module.exports = {
    user_redis_dao
}