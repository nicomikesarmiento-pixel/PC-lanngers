const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Random User-Agents para sa bawat request para hindi makahalata ang YouTube
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0'
];

function getRandomUA() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

app.get('/', (req, res) => {
    res.json({
        status: "online",
        engine: "Direct YouTube Stealth Bypass Engine",
        usage: "/api/youtube-stealth?search=keyword"
    });
});

// 🔥 Direct YouTube Scraper na may Anti-Bot Spoofing
app.get('/api/youtube-stealth', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).json({
            success: false,
            error: "Maglagay ng search query. Halimbawa: /api/youtube-stealth?search=music"
        });
    }

    try {
        const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        
        // Pinagandang Headers para lokohin ang YouTube na para bang galing sa totoong browser ang Render server
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': getRandomUA(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Cookie: CONSENT=YES+cb.20210328-17-v0; VISITOR_INFO1_LIVE=2026_Bypass_Token' // Dummy consent cookies para maiwasan ang redirect
            }
        });

        const htmlText = await response.text();

        // Kunin ang embedded JSON data ng YouTube gamit ang Regex
        const match = htmlText.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/);

        if (!match) {
            return res.status(403).json({
                success: false,
                error: "Na-detect ng YouTube security wall ang Render IP. Kailangan ng masinsinang headers o cookies."
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
            bypassedByServer: true,
            query: searchQuery,
            totalResults: videoList.length,
            videos: videoList
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Nabigo ang stealth engine na basahin ang YouTube.",
            details: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Stealth YouTube Engine running on port ${PORT}`);
});
            
