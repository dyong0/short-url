const { expect } = require('chai');
const sinon = require('sinon');
const redis = require('../redis');
const redisClient = require('redis-mock').createClient();
redis.setClient(redisClient);

const shortUrl = require('./shortUrl');

describe('Short URL', () => {
    describe('#saveUrl()', () => {
        beforeEach(() => {
        });
        afterEach((done) => {
            redisClient.flushall(() => {
                done();
            });
        });

        it('saves the given url and key', (done) => {
            shortUrl.saveUrl('key', 'https://google.com').then(() => {
                redisClient.get('short_url:url:key', (err, reply) => {
                    expect(reply).to.equal('https://google.com');
                    done();
                });
            });
        });

        it('overwrites an existing hash with the given', (done) => {
            Promise.all([
                shortUrl.saveUrl('key', 'https://google.com'),
                shortUrl.saveUrl('key', 'https://hoogle.com')
            ]).then(() => {
                redisClient.get('short_url:url:key', (err, reply) => {
                    expect(reply).to.equal('https://hoogle.com');
                    done();
                });
            });
        });

        it('resets expiration time when overwriting', (done) => {
            const clock = sinon.useFakeTimers();

            shortUrl.saveUrl('key', 'https://google.com').then(() => {
                clock.tick(2000);
                return new Promise((resolve) => {
                    redisClient.ttl('short_url:url:key', (err, reply) => {
                        expect(reply).to.be.lessThan(26400);
                        resolve();
                    });
                });
            }).then(() => {
                shortUrl.saveUrl('key', 'https://hoogle.com').then(() => {
                    redisClient.ttl('short_url:url:key', (err, reply) => {
                        expect(reply).to.be.equal(26400);
                        done();
                    });
                });
            });
        });
    });

    describe('#findUrlByHash()', () => {
        beforeEach(() => {
        });
        afterEach((done) => {
            redisClient.flushall(() => {
                done();
            });
        });

        it('Returns a corresponding url on the given hash', (done) => {
            redisClient.set('short_url:url:key', 'https://google.com', async (err, reply) => {
                const found = await shortUrl.findUrlByHash('key');
                expect(found).to.equal('https://google.com');
                done();
            });
        });
        it('Returns null when the given hash not existing', async () => {
            const found = await shortUrl.findUrlByHash('non_existing');
            expect(found).to.be.null;
        });
    });

    describe('#generateUrlHash()', () => {
        beforeEach(() => {
        });
        afterEach((done) => {
            redisClient.flushall(() => {
                done();
            });
        });

        it('Returns a hash on a url', () => {
            const hash = shortUrl.generateUrlHash('https://google.com');
            expect(hash).to.be.a('string');
        });

        it('Returns different hashes on different urls', () => {
            let firstHash = shortUrl.generateUrlHash('https://google.com');
            let secondHash = shortUrl.generateUrlHash('https://hoogle.com');

            expect(firstHash).to.not.equal(secondHash);
        });
    });
});