module.exports = function createUrlHash(configs) {
    let nextHash = 0;
    let urls = {};
    let urlCount = 0;

    const MAX_HASH_SIZE = 99999999;

    function store(hash, url) {
        if(nextHash >= MAX_HASH_SIZE) {
            throw new Error('Hash is full');
        }

        const hasExisting = (typeof urls[hash] !== 'undefined');

        urls[hash] = url;

        if(hasExisting === false) {
            ++urlCount;
            ++nextHash;
        }
    }

    function getUrlByHash(hash) {
        return urls[hash] ? urls[hash] : null;
    }

    function generateHash(url) {
        // Tricks generating the same hash by looking up one existing
        for(var k in urls) {
            if (urls[k] === url) {
                return k;
            }
        }

        return nextHash.toString();
    }

    function getSize() {
        return urlCount;
    }

    return {
        urls,
        store,
        getUrlByHash,
        generateHash,
        getSize,
    };
};