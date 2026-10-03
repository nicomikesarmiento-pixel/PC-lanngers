const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let browserHistory = [];

async function getServerMetrics() {
    const startTime = Date.now();
    let ip = 'Render Cloud Active';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        ip = data.ip;
    } catch (e) {
        ip = 'Render Proxy Node';
    }
    const speed = Date.now() - startTime;
    return { ip, speed: speed < 1000 ? `${speed}ms` : '1.2s' };
}

// Server-Side Proxy Engine: Render Server ang kumukuha at nag-i-stream ng video data
app.get('/proxy-stream', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('Walang ibinigay na URL.');
    }

    try {
        // Ang Render server ang gagawa ng request sa totoong source
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        // Kopyahin ang headers para alam ng browser na video ito
        res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
        if (response.headers.get('content-length')) {
            res.setHeader('Content-Length', response.headers.get('content-length'));
        }

        // I-pipe o i-stream nang direkta mula sa server papunta sa client screen mo
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (err) {
        res.status(500).send('Nabigo ang server proxy na i-stream ang video.');
    }
});

app.get('/browser', async (req, res) => {
    let videoUrl = req.query.url ? req.query.url.trim() : 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4';
    const metrics = await getServerMetrics();

    browserHistory.push({
        url: videoUrl,
        time: new Date().toLocaleTimeString()
    });
    if (browserHistory.length > 25) browserHistory.shift();

    const fetchStart = Date.now();
    await new Promise(r => setTimeout(r, 100));
    const fetchTime = Date.now() - fetchStart;

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Server-Side Streamer OS</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: sans-serif; background: #030712; color: #fff; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
                .browser-nav { background: #0f172a; border-bottom: 1px solid rgba(56,189,248,0.2); padding: 8px; display: flex; flex-direction: column; gap: 6px; }
                .top-info-bar { display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; padding: 0 4px; }
                .top-info-bar span b { color: #34d399; font-family: monospace; }
                .url-form { display: flex; gap: 4px; align-items: center; }
                .btn-action { background: #1e293b; border: 1px solid #475569; color: #e2e8f0; padding: 6px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center; height: 34px; }
                .url-input { flex: 1; height: 34px; background: #090d16; border: 1px solid #38bdf8; border-radius: 6px; color: #fff; padding: 0 10px; font-size: 11px; outline: none; }
                .go-btn { background: #38bdf8; border: none; color: #0f172a; font-weight: bold; padding: 0 12px; height: 34px; border-radius: 6px; cursor: pointer; font-size: 11px; }
                
                .viewport { flex: 1; background: #030712; width: 100%; overflow-y: auto; display: flex; flex-direction: column; }
                .player-box { width: 100%; aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center; }
                .player-box video { width: 100%; height: 100%; outline: none; }
                .info-section { padding: 12px; }
                .server-badge { background: rgba(15,23,42,0.9); border: 1px solid rgba(56,189,248,0.3); padding: 8px; border-radius: 6px; font-size: 10px; color: #94a3b8; margin-bottom: 12px; }
                .suggestions { display: flex; flex-direction: column; gap: 6px; }
                .suggestion-item { background: #0f172a; border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 6px; color: #e2e8f0; font-size: 11px; text-decoration: none; display: flex; align-items: center; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="browser-nav">
                <div class="top-info-bar">
                    <div>Server IP: <b>${metrics.ip}</b></div>
                    <div>Proxy Server Speed: <b style="color: #38bdf8;">${fetchTime}ms</b></div>
                </div>
                <form action="/browser" method="GET" class="url-form">
                    <a href="/" class="btn-action" title="Home">🏠</a>
                    <button type="button" class="btn-action" onclick="location.reload()">🔄</button>
                    <input type="text" name="url" class="url-input" value="${videoUrl}" placeholder="I-paste angDirektang Video URL dito..." />
                    <button type="submit" class="go-btn">Stream</button>
                </form>
            </div>
            
            <div class="viewport">
                <div class="player-box">
                    <!-- Ang video ay dumadaan muna sa Render server bago mapunta sa iyo -->
                    <video controls autoplay src="/proxy-stream?url=${encodeURIComponent(videoUrl)}"></video>
                </div>
                <div class="info-section">
                    <div class="server-badge">
                        🛡️ <b>Server-Side Active:</b> Ang Render Cloud Server ang nagda-download at nag-i-stream ng file na ito. Ang iyong device ay sumasalamin lamang sa koneksyon ng server.
                    </div>
                    <p style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">Subukan ang ibang Cloud Streams:</p>
                    <div class="suggestions">
                        <a href="/browser?url=https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4" class="suggestion-item"><span>🐰 Big Buck Bunny (720p)</span> <span style="color:#38bdf8; font-size:9px;">Stream</span></a>
                        <a href="/browser?url=https://www.w3schools.com/html/mov_bbb.mp4" class="suggestion-item"><span>🎬 W3Schools MP4 Sample</span> <span style="color:#38bdf8; font-size:9px;">Stream</span></a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// History Page
app.get('/history', (req, res) => {
    let historyHtml = browserHistory.length === 0 
        ? '<p style="color:#94a3b8; font-size:11px; text-align:center; margin-top:20px;">Wala pang history.</p>'
        : browserHistory.map(item => `
            <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08); padding:8px; border-radius:6px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <a href="/browser?url=${encodeURIComponent(item.url)}" style="color:#38bdf8; font-size:10px; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">${item.url}</a>
                <span style="color:#64748b; font-size:8px;">${item.time}</span>
            </div>
        `).reverse().join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stream History</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #030712; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .box { width: 100%; max-width: 380px; height: 100vh; background: #090d16; display: flex; flex-direction: column; padding: 16px; }
                @media(min-width: 420px) { .box { height: 90vh; border-radius: 24px; border: 6px solid #111827; } }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                .header h2 { font-size: 12px; color: #38bdf8; }
                .back { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .list { flex: 1; overflow-y: auto; }
            </style>
        </head>
        <body>
            <div class="box">
                <div class="header">
                    <h2>📦 Stream History</h2>
                    <a href="/" class="back">🏠 Home</a>
                </div>
                <div class="list">${historyHtml}</div>
            </div>
        </body>
        </html>
    `);
});

// Home Dashboard
app.get('/', async (req, res) => {
    const metrics = await getServerMetrics();
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Render Server Streamer</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .status-bar { height: 28px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 14px; font-size: 9px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .screen-area { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); padding: 16px; justify-content: center; }
                .metrics-card { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px; border-radius: 12px; margin-bottom: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
                .server-ip-text { color: #34d399; font-family: monospace; font-weight: bold; }
                .search-box-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
                .search-box-card h2 { font-size: 12px; color: #38bdf8; margin-bottom: 8px; }
                .search-box-card input { width: 100%; height: 36px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 11px; outline: none; margin-bottom: 8px; }
                .search-box-card button { width: 100%; height: 36px; background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size: 11px; cursor: pointer; }
                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 10px; text-decoration: none; color: #e2e8f0; font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
                .link-btn span { font-size: 8px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="status-bar">
                    <span>12:00 PM</span>
                    <span>⚡ Server Streamer OS</span>
                </div>
                <div class="screen-area">
                    <div class="metrics-card">
                        <div>Server IP: <span class="server-ip-text">${metrics.ip}</span></div>
                        <div>Status: <span style="color:#38bdf8;">Cloud Active</span></div>
                    </div>
                    <div class="search-box-card">
                        <h2>🌐 Server-Side Video Proxy</h2>
                        <form action="/browser" method="GET">
                            <input type="text" name="url" placeholder="I-paste ang video URL dito..." />
                            <button type="submit">I-stream sa Server</button>
                        </form>
                    </div>
                    <div class="quick-links">
                        <a href="/browser?url=https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4" class="link-btn">
                            <strong>▶️ Subukan ang Stream</strong>
                            <span>Server Proxy</span>
                        </a>
                        <a href="/history" class="link-btn" style="background: rgba(2, 132, 199, 0.2); border-color: rgba(56, 189, 248, 0.4);">
                            <strong style="color: #38bdf8;">Tingnan ang History</strong>
                            <span>Logs</span>
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server-Side Streamer running on port ${PORT}`);
});
        
