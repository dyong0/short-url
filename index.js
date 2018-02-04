const app = require('./app');
const config = require('./config');
const redis = require('./redis');

redis.createClient({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
}).on('connect', () => {
    const port = config.app.port;
    app.listen(config.app.port, () => {
        console.log(`Server is listening ${port}`);
    });
});