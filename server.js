const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. IP Check Endpoint
app.get('/api/check-ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({
            success: true,
            runningOn: "Render Cloud Server",
            serverIp: data.ip,
            note: "Render server ang nagpoproseso at humihila ng data mula sa YouTube."
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. YouTube Lite Web Interface
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Lite Streamer</title>
            <style>
                body { font-family: Arial, sans-serif; background: #121212; color: #fff; margin: 0; padding: 10px; }
                h2 { text-align: center; color: #ff4444; margin-bottom: 10px; font-size: 20px; }
                .top-bar { display: flex; gap: 8px; max-width: 600px; margin: 0 auto 10px auto; }
                input { flex: 1; padding: 10px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff; font-size: 15px; }
                button { padding: 10px 15px; background: #ff0000; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
                button.blue { background: #0066cc; font-size: 13px; }
                button:hover { opacity: 0.8; }
                #ip-display { max-width: 600px; margin: 0 auto 10px auto; background: #1a1a1a; padding: 8px; border-radius: 4px; font-size: 12px; color: #00ffcc; display: none; word-break: break-all; }
                #player-container { max-width: 600px; margin: 0 auto 15px auto; display: none; }
                iframe { width: 100%; height: 250px; border-radius: 6px; border: none; }
                .video-list { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
                .video-item { display: flex; gap: 10px; background: #1e1e1e; padding: 8px; border-radius: 6px; cursor: pointer; align-items: center; }
                .video-item:hover { background: #2a2a2a; }
                .video-item img { width: 110px; height: 62px; object-fit: cover; border-radius: 4px; }
                .video-title { font-size: 13px; font-weight: bold; color: #fff; line-height: 1.3; }
                .video-channel { font-size: 11px; color: #aaa; margin-top: 4px; }
                .loading { text-align: center; color: #aaa; font-size: 14px; margin-top: 20px; display: none; }
            </style>
        </head>
        <body>
            <h2>YouTube Lite</h2>
            
            <div class="top-bar">
                <button class="blue" onclick="checkServerIP()" style="width: 100%;">I-check ang Server IP</button>
            </div>
            <div id="ip-display">Kinukuha ang Server IP...</div>

            <div class="top-bar">
                <input type="text" id="query" placeholder="Maghanap..." onkeypress="if(event.key === 'Enter') searchVideos()">
                <button onclick="searchVideos()">Hanapin</button>
            </div>

            <div id="player-container">
                <iframe id="youtube-player" src="" allowfullscreen></iframe>
            </div>

            <div class="loading" id="loading-text">Hinahanap ang mga video...</div>
            <div class="video-list" id="results"></div>

            <script>
                async function checkServerIP() {
                    const ipBox = document.getElementById('ip-display');
                    ipBox.style.display = 'block';
                    ipBox.innerHTML = "Kinukuha ang IP ng Render server...";
                    try {
                        const res = await fetch('/api/check-ip');
                        const data = await res.json();
                        if(data.success) {
                            ipBox.innerHTML = \`<b>Server IP:</b> \${data.serverIp} (\${data.runningOn})\`;
                        } else {
                            ipBox.innerHTML = "Hindi nakuha ang IP.";
                        }
                    } catch(e) {
                        ipBox.innerHTML = "Error sa pag-check ng IP.";
                    }
                }

                async function searchVideos() {
                    const q = document.getElementById('query').value;
                    if(!q) return;
                    
                    const list = document.getElementById('results');
                    const loader = document.getElementById('loading-text');
                    list.innerHTML = '';
                    loader.style.display = 'block';

                    try {
                        const res = await fetch('/api/youtube?search=' + encodeURIComponent(q));
                        const data = await res.json();
                        loader.style.display = 'none';

                        if(data.success && data.videos && data.videos.length > 0) {
                            data.videos.forEach(v => {
                                const item = document.createElement('div');
                                item.className = 'video-item';
                                item.onclick = () => playVideo(v.videoId);
                                item.innerHTML = \`
                                    <img src="\${v.thumbnail}" />
                                    <div>
                                        <div class="video-title">\${v.title}</div>
                                        <div class="video-channel">\${v.channel}</div>
                                    </div>
                                \`;
                                list.appendChild(item);
                            });
                        } else {
                            list.innerHTML = '<p style="text-align:center; color:#aaa;">Walang nahanap o na-block ng anti-bot.</p>';
                        }
                    } catch (e) {
                        loader.style.display = 'none';
                        list.innerHTML = '<p style="text-align:center; color:#ff4444;">May error sa koneksyon.</p>';
                    }
                }

                function playVideo(id) {
                    const playerContainer = document.getElementById('player-container');
                    const player = document.getElementById('youtube-player');
                    player.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
                    playerContainer.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            </script>
        </body>
        </html>
    `);
});

// 3. YouTube Lite API Endpoint (Inago ang paghila para iwas anti-bot)
app.get('/api/youtube', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).json({ success: false, error: "Walang search query." });
    }

    try {
        // Ginagamit natin ang YouTube embedded search/suggestions o RSS/MRSS feed approach para hindi ma-block
        const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&persist_app=1&app=m`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Accept-Language': 'fil-PH,fil;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        const htmlText = await response.text();
        const match = htmlText.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/);

        if (!match) {
            return res.status(500).json({ success: false, error: "Naharangan ng YouTube bot detection." });
        }

        const ytData = JSON.parse(match[1]);
        
        // Sinisipat natin ang iba't ibang posibleng lokasyon ng video list sa JSON response ng YouTube mobile view
        let contents = null;
        try {
            contents = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
                       ytData.contents?.sectionListRenderer?.contents;
        } catch (e) {
            contents = null;
        }

        let videoList = [];

        if (contents) {
            for (let section of contents) {
                const items = section.itemSectionRenderer?.contents || section.richGridRenderer?.contents;
                if (items) {
                    for (let item of items) {
                        const video = item.videoRenderer || item.richItemRenderer?.content?.videoRenderer;
                        if (video && video.videoId) {
                            videoList.push({
                                title: video.title?.runs?.[0]?.text || video.title?.simpleText || "No Title",
                                videoId: video.videoId,
                                thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
                                channel: video.ownerText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || "Unknown"
                            });
                        }
                    }
                }
            }
        }

        res.json({
            success: true,
            totalResults: videoList.length,
            videos: videoList
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`YouTube Lite server running on port ${PORT}`);
});
        
