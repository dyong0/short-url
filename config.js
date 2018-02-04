const app = {
    port: process.env.PORT || 8080
};

const redis = {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'redis',
};

module.exports.app = app;
module.exports.redis = redis;