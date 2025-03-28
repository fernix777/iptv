const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Middleware to handle JSON requests
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Proxy endpoint to fetch M3U content
app.get('/proxy', async (req, res) => {
    try {
        const decodedUrl = decodeURIComponent(req.query.url);
        const encodedUrl = new URL(decodedUrl).href;
        const response = await fetch(encodedUrl, { redirect: 'follow' });
        if (!response.ok) {
            return res.status(response.status).send(`Error fetching the URL: ${response.statusText}`);
        }
        const content = await response.text();
        res.type('application/vnd.apple.mpegurl').send(content);
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});