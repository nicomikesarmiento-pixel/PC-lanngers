const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: "online",
        engine: "Lightweight YouTube Proxy Engine",
        usage: "Gamitin ang /api/youtube?search=keyword"
    });
});

app.get('/api/youtube', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).json({
            success: false,
            error: "Maglagay ng search query. Halimbawa: /api/youtube?search=music"
        });
    }

    try {
        const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const htmlText = await response.text();
        const match = htmlText.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/);

        if (!match) {
            return res.status(500).json({
                success: false,
                error: "Hindi makuha ang data mula sa YouTube."
            });
        }

        const ytData = JSON.parse(match[1]);
        const contents = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

        let videoList = [];

        if (contents) {
            for (let section of contents) {
                const items = section.itemSectionRenderer?.contents;
                if (items) {
                    for (let item of items) {
                        const video = item.videoRenderer;
                        if (video && video.videoId) {
                            videoList.push({
                                title: video.title?.runs?.[0]?.text || "No Title",
                                videoId: video.videoId,
                                thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
                                duration: video.lengthText?.simpleText || "N/A",
                                channel: video.ownerText?.runs?.[0]?.text || "Unknown"
                            });
                        }
                    }
                }
            }
        }

        res.json({
            success: true,
            query: searchQuery,
            totalResults: videoList.length,
            videos: videoList
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "May naganap na error sa server.",
            details: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Lightweight YouTube Engine running on port ${PORT}`);
});
        
