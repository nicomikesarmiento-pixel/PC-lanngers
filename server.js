const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Endpoint para i-check ang Server IP at malaman kung sa Render ito nanggagaling
app.get('/api/check-ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({
            success: true,
            runningOn: "Render Cloud Server",
            serverIp: data.ip,
            note: "Kung ang IP na ito ay iba sa IP ng cellphone mo, ibig sabihin ang Render server ang nagpoproseso at humihila ng data mula sa YouTube."
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Ang Mini YouTube Web Interface (May kasamang IP display button)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Proxy Streamer + IP Check</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 15px; }
                h2 { text-align: center; color: #ff0000; }
                .search-box, .ip-box { display: flex; gap: 10px; max-width: 600px; margin: 0 auto 15px auto; }
                input { flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #333; background: #222; color: #fff; font-size: 16px; }
                button { padding: 10px 20px; background: #ff0000; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
                button.blue { background: #0066cc; }
                button:hover { opacity: 0.9; }
                #ip-display { max-width: 600px; margin: 0 auto 15px auto; background: #1a1a1a; padding: 10px; border-radius: 5px; font-size: 13px; color: #00ffcc; display: none; word-break: break-all; }
                #player-container { max-width: 600px; margin: 0 auto 20px auto; display: none; }
                iframe { width: 100%; height: 315px; border-radius: 8px; border: none; }
                .video-list { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
                .video-item { display: flex; gap: 10px; background: #1f1f1f; padding: 10px; border-radius: 8px; cursor: pointer; align-items: center; }
                .video-item:hover { background: #2a2a2a; }
                .video-item img { width: 120px; height: 68px; object-fit: cover; border-radius: 4px; }
                .video-title { font-size: 14px; font-weight: bold; color: #fff; }
                .video-channel { font-size: 12px; color: #aaa; margin-top: 5px; }
            </style>
        </head>
        <body>
            <h2>YouTube Proxy Streamer</h2>
            
            <div class="ip-box">
                <button class="blue" onclick="checkServerIP()" style="width: 100%;">I-check ang Server IP (Patunay na Server ang Gumabago)</button>
            </div>
            <div id="ip-display">Kinukuha ang Server IP...</div>

            <div class="search-box">
                <input type="text" id="query" placeholder="Maghanap ng video..." onkeypress="if(event.key === 'Enter') searchVideos()">
                <button onclick="searchVideos()">Hanapin</button>
            </div>

            <div id="player-container">
                <iframe id="youtube-player" src="" allowfullscreen></iframe>
            </div>

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
                            ipBox.innerHTML = \`<b>Server Running On:</b> \${data.runningOn}<br><b>Server IP Address:</b> \${data.serverIp}<br><i>(\${data.note})</i>\`;
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
                    const res = await fetch('/api/youtube?search=' + encodeURIComponent(q));
                    const data = await res.json();
                    
                    const list = document.getElementById('results');
                    list.innerHTML = '';

                    if(data.success && data.videos) {
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

// 3. Ang YouTube API Endpoint na may Anti-Bot Headers Bypass
app.get('/api/youtube', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).json({ success: false, error: "Walang search query." });
    }

    try {
        const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'X-Forwarded-For': '8.8.8.8'
            }
        });

        const htmlText = await response.text();
        const match = htmlText.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/);

        if (!match) {
            return res.status(500).json({ success: false, error: "Na-detect o naharangan ng YouTube ang kahilingan." });
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
                                channel: video.ownerText?.runs?.[0]?.text || "Unknown"
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
    console.log(`Proxy server running on port ${PORT}`);
});
