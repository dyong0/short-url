const request = require('supertest');
const { expect } = require('chai');
const redisMock = require('redis-mock');
const redis = require('./redis');
const redisClient = require('redis-mock').createClient();
redis.setClient(redisClient);

const app = require('./app');

describe('POST /api/shorten-url', () => {
    it('responds 200 on a url just with domain', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com'
            })
            .expect(200)
            .then((res) => {
                return expect(res.text).to.be.a('string');
            });
    });

    it('responds 200 on a url with 1 depth path', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com/1depth'
            })
            .expect(200)
            .then((res) => {
                return expect(res.text).to.be.a('string');
            });
    });

    it('responds 200 on a url with 2 depth path', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com/1depth/2depth'
            })
            .expect(200)
            .then((res) => {
                return expect(res.text).to.be.a('string');
            });
    });

    it('responds 200 on a url with query', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com/withQuery?this=is&que=ry'
            })
            .expect(200)
            .then((res) => {
                return expect(res.text).to.be.a('string');
            });
    });

    it('responds 200 on a url with escaped utf8', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com/withEscaped8%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC'
            })
            .expect(200)
            .then((res) => {
                return expect(res.text).to.be.a('string');
            });
    });

    it('responds 200 on a url with escaped characters in query', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com/withEscapedQuery?this=is%20qwfqf&que=r%20%20asefy'
            })
            .expect(200)
            .then((res) => {
                return expect(res.text).to.be.a('string');
            });
    });

    it('responds 400 on a url without escaping', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com/no t escaped'
            })
            .expect(400);
    });

    it('responds 400 on a url with invalid protocol', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'invalid://protocol.google.com'
            })
            .expect(400);
    });

    it('responds same results on same urls', () => {
        return Promise.all([
            request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com'
            }),
            request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com'
            })
        ]).then((responses) => {
            return expect(responses[0].text).to.equal(responses[1].text);
        });
    });
});


describe('GET /:shortUrl', () => {
    it('responds 404 for not registered url', () => {
        return request(app)
            .get('/unregisteredUrl')
            .expect(404);
    });

    it('responds 304 for the registered url', () => {
        return request(app)
            .post('/api/shorten-url')
            .set('Content-type', 'application/x-www-form-urlencoded')
            .send({
                'url': 'https://google.com'
            })
            .expect(200)
            .then((res) => {
                return request(app)
                    .get(`/${res.text}`)
                    .expect(302)
                    .then((res) => {
                        return expect(res.header.location).to.equal('https://google.com');
                    });
            });
    });
});