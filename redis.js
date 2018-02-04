const redis = require("redis");
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
require('extend-error');

let client = null;

const RedisClientAlreadyExistError = Error.extend('RedisClientAlreadyExistError');

module.exports.RedisClientAlreadyExistError = RedisClientAlreadyExistError;

module.exports.createClient = function createClient(options) {
    if (client) {
        throw new RedisClientAlreadyExistError();
    }

    client = redis.createClient(options);

    return client;
};

module.exports.setClient = function setClient(newClient) {
    client = newClient;

    return client;
};

module.exports.getClient = function getClient() {
    return client;
};