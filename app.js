const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const shortUrl = require('./lib/shortUrl');

const app = express();

// Referred to https://stackoverflow.com/a/3809435/6280377
const validateUrl = (url) => /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/.test(url);

app.use(bodyParser.urlencoded({ extended: true }));

// In order to restrict endpoints for static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/shorten-url', async (req, res) => {
    const longUrl = req.body.url;

    // Assume the url is url-encoded
    if (validateUrl(longUrl) === false) {
        return res.status(400).send('Invalid URL');
    }

    try {
        const existingHash = await shortUrl.findHashByUrl(longUrl);
        let hash = null;
        if (existingHash) {
            hash = existingHash;
        } else {
            hash = shortUrl.generateUrlHash(longUrl);
        }

        await shortUrl.saveUrl(hash, longUrl);

        return res.status(200).send(hash);
    } catch (e) {
        return res.sendStatus(500);
    }
});

app.get('/api/urls/:urlKey', async (req, res) => {
    const urlKey = req.params.urlKey;

    try {
        const originalUrlFound = await shortUrl.findUrlByHash(urlKey);
        if (!originalUrlFound) {
            return res.sendStatus(404);
        }

        const usagesFound = await shortUrl.findUrlUsages(urlKey);

        return res.status(200).json({
            url: originalUrlFound,
            key: urlKey,
            usages: {
                clicks: usagesFound.clicks ? parseInt(usagesFound.clicks, 10) : 0,
                userAgents: usagesFound.userAgents ? usagesFound.userAgents : [],
                referrers: usagesFound.referrers ? usagesFound.referrers : []
            },
        });
    } catch (e) {
        console.log(e);
        return res.sendStatus(500);
    }
});

app.get('/:urlKey', async (req, res) => {
    const urlKey = req.params.urlKey;

    try {
        const found = await shortUrl.findUrlByHash(urlKey);
        if (!found) {
            return res.sendStatus(404);
        }

        await shortUrl.addUrlUsage(urlKey, {
            userAgent: req.header('User-Agent'),
            referrer: req.header('Referer'),
        });
        return res.redirect(found);
    } catch (e) {
        return res.sendStatus(500);
    }
});

module.exports = app;