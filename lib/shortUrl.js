const redis = require('../redis');
require('extend-error');

const URL_EXPIRES_IN_SEC = 26400; // 1day
const URL_USAGE_EXPIRES_IN_SEC = 26400; // 1day

module.exports.URL_EXPIRES_IN_SEC = URL_EXPIRES_IN_SEC;
module.exports.URL_USAGE_EXPIRES_IN_SEC = URL_USAGE_EXPIRES_IN_SEC;

module.exports.generateUrlHash = function generateUrlHash() {
    const hashLen = 1 + Math.floor(Math.random() * 7); // 1 to 8

    // Generate random string using base58 code table
    const ENCODING_BASE = 58;
    const BASE58_TABLE = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    const encodedPartials = [];
    for(let i=0; i < hashLen; ++i) {
        const at = Math.floor(Math.random() * ENCODING_BASE);
        encodedPartials.push(BASE58_TABLE.charAt(at));
    }

    return encodedPartials.join('');
};

module.exports.findUrlByHash = async function findUrlByHash(hash) {
    return new Promise((resolve, reject) => {
        redis.getClient().get(`short_url:url:${hash}`, (err, reply) => {
            if (err) {
                reject(err);
            }

            resolve(reply);
        });
    });
};

module.exports.findHashByUrl = async function findHashByUrl(url) {
    const urlEncoded = Buffer.from(url).toString('base64');

    return new Promise((resolve, reject) => {
        redis.getClient().get(`short_url:hash:${urlEncoded}`, (err, reply) => {
            if (err) {
                reject(err);
            }

            resolve(reply);
        });
    });
};

module.exports.saveUrl = async function createUrl(key, url) {
    const urlEncoded = Buffer.from(url).toString('base64');

    return new Promise((resolve, reject) => {
        redis.getClient().multi()
            .set(`short_url:url:${key}`, url, 'EX', URL_EXPIRES_IN_SEC)
            .set(`short_url:hash:${urlEncoded}`, key, 'EX', URL_EXPIRES_IN_SEC)
            .exec((err, replies) => {
                if (err) {
                    reject(err);
                }

                resolve(replies);
            });
    });
};

module.exports.addUrlUsage = async function addUrlUsage(key, usage) {
    const { userAgent, referrer } = usage;

    const multi = redis.getClient().multi();

    multi.incr(`short_url:url_usages:clicks:${key}`);
    multi.expire(`short_url:url_usages:clicks:${key}`, URL_USAGE_EXPIRES_IN_SEC);

    if (userAgent) {
        multi.sadd(`short_url:url_usages:user_agents:${key}`, userAgent);
        multi.expire(`short_url:url_usages:user_agents:${key}`, URL_USAGE_EXPIRES_IN_SEC);
    }

    if (referrer) {
        multi.sadd(`short_url:url_usages:referrers:${key}`, referrer);
        multi.expire(`short_url:url_usages:referrers:${key}`, URL_USAGE_EXPIRES_IN_SEC);
    }

    return new Promise((resolve, reject) => {
        multi.exec((err, replies) => {
            if (err) {
                reject(err);
            }

            resolve(replies);
        });
    });
};

module.exports.findUrlUsages = async function findUrlUsages(key) {
    return new Promise((resolve, reject) => {
        redis.getClient().multi()
            .get(`short_url:url_usages:clicks:${key}`)
            .smembers(`short_url:url_usages:user_agents:${key}`)
            .smembers(`short_url:url_usages:referrers:${key}`)
            .exec((err, replies) => {
                if (err) {
                    reject(err);
                }

                resolve({
                    clicks: replies[0],
                    userAgents: replies[1],
                    referrers: replies[2],
                });
            });
    });
};