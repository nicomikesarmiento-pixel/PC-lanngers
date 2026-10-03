const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Listahan ng mga mobile User-Agents para sa anti-bot bypass
const MOBILE_USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
];

function getRandomUserAgent() {
    return MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)];
}

function getRandomIP() {
    const r = () => Math.floor(Math.random() * 254) + 1;
    return `${r()}.${r()}.${r()}.${r()}`;
}

// 1. JSON API: Server IP & Bypass Status Check
app.get('/api/check-ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        // Ibabalik bilang malinaw na JSON object
        res.json({
            success: true,
            server: "Render Cloud Server",
            serverIp: data.ip,
            status: "Active",
            bypassMode: "Mobile Spoofing + Random IP Rotation Enabled",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// 2. JSON API: Facebook Watch Scraper/Proxy Data
app.get('/api/fetch-fb', async (req, res) => {
    let targetUrl = req.query.url || 'https://m.facebook.com/watch/';
    
    try {
        const spoofedUserAgent = getRandomUserAgent();
        const spoofedIP = getRandomIP();

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': spoofedUserAgent,
                'Accept-Language': 'en-US,en;q=0.9,fil;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'X-Forwarded-For': spoofedIP,
                'Cache-Control': 'no-cache'
            }
        });

        const htmlText = await response.text();
        
        let videoList = [];
        const linkRegex = /href="(\/watch\/\?v=\d+|\/[^"]+\/videos\/[^"]+|\/share\/v\/[^"]+)"/g;
        let match;
        
        while ((match = linkRegex.exec(htmlText)) !== null && videoList.length < 20) {
            let path = match[1];
            if (!path.startsWith('http')) {
                path = 'https://m.facebook.com' + path;
            }
            
            if (!videoList.some(v => v.videoUrl === path)) {
                videoList.push({
                    title: "Facebook Watch Stream Item",
                    videoUrl: path,
                    thumbnail: "https://via.placeholder.com/110x62?text=FB+Watch"
                });
            }
        }

        if (videoList.length === 0) {
            videoList.push({
                title: "Buksan ang Facebook Watch URL",
                videoUrl: targetUrl,
                thumbnail: "https://via.placeholder.com/110x62?text=FB+Link"
            });
        }

        // Malinaw na JSON response para sa mga nakuhaang video
        res.json({
            success: true,
            targetUrl: targetUrl,
            spoofedIpUsed: spoofedIP,
            totalVideos: videoList.length,
            videos: videoList
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// 3. Main Web Interface (HTML Client)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FB Watch JSON Proxy Suite</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f1115; color: #fff; margin: 0; padding: 12px; }
                h2 { text-align: center; color: #2d88ff; margin-bottom: 12px; font-size: 20px; }
                .top-bar { display: flex; gap: 8px; max-width: 600px; margin: 0 auto 10px auto; }
                input { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #1a1d24; color: #fff; font-size: 14px; outline: none; }
                button { padding: 12px 18px; background: #2d88ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
                button.blue { background: #0066cc; font-size: 13px; width: 100%; }
                button:hover { opacity: 0.9; }
                #ip-display { max-width: 600px; margin: 0 auto 12px auto; background: #161922; padding: 10px; border-radius: 6px; font-size: 12px; color: #00ffcc; display: none; word-break: break-all; border: 1px solid #222; }
                
                #native-player-box { max-width: 600px; margin: 0 auto 15px auto; background: #161922; padding: 12px; border-radius: 8px; display: none; border: 1px solid #333; }
                #active-video-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #fff; }
                iframe { width: 100%; height: 280px; border-radius: 6px; border: none; background: #000; }

                .video-list { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
                .video-item { display: flex; gap: 10px; background: #161922; padding: 10px; border-radius: 8px; cursor: pointer; align-items: center; border: 1px solid #222; }
                .video-item:hover { background: #1f232d; }
                .video-item img { width: 110px; height: 62px; object-fit: cover; border-radius: 4px; background: #222; }
                .video-title { font-size: 13px; font-weight: bold; color: #fff; line-height: 1.3; }
                .video-channel { font-size: 11px; color: #8ab4f8; margin-top: 4px; }
                .loading { text-align: center; color: #888; font-size: 14px; margin-top: 20px; display: none; }
            </style>
        </head>
        <body>
            <h2>FB Watch JSON Proxy</h2>
            
            <div class="top-bar">
                <button class="blue" onclick="checkServerIP()">I-check ang Server IP & JSON Status</button>
            </div>
            <div id="ip-display">Kinukuha ang Server IP...</div>

            <div class="top-bar">
                <input type="text" id="query" value="https://m.facebook.com/watch/" placeholder="Ilagay ang FB Watch link dito..." onkeypress="if(event.key === 'Enter') loadFacebookContent()">
                <button onclick="loadFacebookContent()">Buksan</button>
            </div>

            <div id="native-player-box">
                <div id="active-video-title">Video Player</div>
                <iframe id="video-player" src="" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
            </div>

            <div class="loading" id="loading-text">Binabasa ng Server ang Facebook Link...</div>
            <div class="video-list" id="results"></div>

            <script>
                window.onload = () => {
                    loadFacebookContent();
                };

                async function checkServerIP() {
                    const ipBox = document.getElementById('ip-display');
                    ipBox.style.display = 'block';
                    ipBox.innerHTML = "Kinukuha ang JSON data mula sa Server...";
                    try {
                        const res = await fetch('/api/check-ip');
                        const data = await res.json();
                        if(data.success) {
                            ipBox.innerHTML = \`<b>Server IP:</b> \${data.serverIp} (\${data.server})<br><i>\${data.bypassMode}</i>\`;
                        } else {
                            ipBox.innerHTML = "Hindi nakuha ang JSON data.";
                        }
                    } catch(e) {
                        ipBox.innerHTML = "Error sa pag-check ng IP.";
                    }
                }

                async function loadFacebookContent() {
                    const inputVal = document.getElementById('query').value;
                    const list = document.getElementById('results');
                    const loader = document.getElementById('loading-text');
                    
                    list.innerHTML = '';
                    loader.style.display = 'block';

                    try {
                        const res = await fetch('/api/fetch-fb?url=' + encodeURIComponent(inputVal));
                        const data = await res.json();
                        loader.style.display = 'none';

                        if(data.success && data.videos && data.videos.length > 0) {
                            if(inputVal.includes('/watch') || inputVal.includes('/videos/') || inputVal.includes('/share/v/')) {
                                playInNativeApp(inputVal, "Direktang Pinapanood mula sa Link");
                            }

                            data.videos.forEach(v => {
                                const item = document.createElement('div');
                                item.className = 'video-item';
                                item.onclick = () => playInNativeApp(v.videoUrl, v.title);
                                item.innerHTML = \`
                                    <img src="\${v.thumbnail}" />
                                    <div>
                                        <div class="video-title">\${v.title}</div>
                                        <div class="video-channel">JSON Proxy (Spoofed IP: \${data.spoofedIpUsed})</div>
                                    </div>
                                \`;
                                list.appendChild(item);
                            });
                        } else {
                            list.innerHTML = '<p style="text-align:center; color:#888;">Walang nakitang video o protektado ang link.</p>';
                        }
                    } catch (e) {
                        loader.style.display = 'none';
                        list.innerHTML = '<p style="text-align:center; color:#ff4444;">May error sa JSON server response.</p>';
                    }
                }

                function playInNativeApp(url, title) {
                    const playerBox = document.getElementById('native-player-box');
                    const player = document.getElementById('video-player');
                    const titleDiv = document.getElementById('active-video-title');

                    titleDiv.innerText = title;
                    player.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=false&width=500&autoplay=true';
                    
                    playerBox.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`FB Watch JSON Proxy Server running on port ${PORT}`);
});
        
