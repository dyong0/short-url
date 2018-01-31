const createUrlHash = require('./urlHash');
const {expect} = require('chai');

describe('URL Hash', () => {
    describe('#store()', () => {
        it('stores the given hash', () => {
            const urlHash = createUrlHash();
            urlHash.store('hash', 'https://google.com');

            expect(urlHash.getSize()).to.equal(1);
            expect(urlHash.urls['hash']).to.equal('https://google.com');
        });
        it('overwrites an existing hash with the given', () => {
            const urlHash = createUrlHash();
            urlHash.store('hash', 'https://google.com');
            urlHash.store('another_hash', 'https://google.com/another');
            urlHash.store('hash', 'https://google.com/updated');

            expect(urlHash.getSize()).to.equal(2);
            expect(urlHash.urls['hash']).to.not.equal('https://google.com');
            expect(urlHash.urls['another_hash']).to.equal('https://google.com/another');
            expect(urlHash.urls['hash']).to.equal('https://google.com/updated');
        });
    });

    describe('#getUrlByHash()', () => {
        it('Returns a corresponding url on the given hash', () => {
            const urlHash = createUrlHash();
            urlHash.store('hash', 'https://google.com');
            urlHash.store('another_hash', 'https://google.com/another');

            expect(urlHash.getUrlByHash('hash')).to.equal('https://google.com');
            expect(urlHash.getUrlByHash('another_hash')).to.equal('https://google.com/another');
        });
        it('Returns null when the given hash not existing', () => {
            const urlHash = createUrlHash();
            urlHash.store('hash', 'https://google.com');
            urlHash.store('another_hash', 'https://google.com/another');

            expect(urlHash.getUrlByHash('non_existing')).to.be.null;
        });
    });

    describe('#generateHash()', () => {
        it('Returns a hash on a url', () => {
            const urlHash = createUrlHash();
            const hash = urlHash.generateHash('https://google.com');

            expect(hash).to.be.a('string');
        });

        it('Returns the same hash on the same urls', () => {
            const urlHash = createUrlHash();
            let firstHash = urlHash.generateHash('https://google.com');
            let secondHash = urlHash.generateHash('https://google.com');
            expect(firstHash).to.equal(secondHash);

            firstHash = urlHash.generateHash('https://google.com');
            urlHash.store(firstHash, 'https://google.com');
            secondHash = urlHash.generateHash('https://google.com');

            expect(firstHash).to.equal(secondHash);
        });

        it('Returns different hashes on different stored urls', () => {
            const urlHash = createUrlHash();
            const firstHash = urlHash.generateHash('https://google.com');
            urlHash.store(firstHash);
            const secondHash = urlHash.generateHash('https://docs.google.com/document/d/5434SFq3fs1w1e21');

            expect(firstHash).to.not.equal(secondHash);
        });
    });
});