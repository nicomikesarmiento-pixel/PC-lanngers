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
        ip = 'Render High-Speed Node';
    }
    const speed = Date.now() - startTime;
    return { ip, speed: speed < 1000 ? `${speed}ms` : '0.4s' };
}

// 🌐 Cloud Signal Controller Engine
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.redirect('/browser');

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        let contentType = response.headers.get('content-type') || 'text/html';
        let body = await response.text();

        if (contentType.includes('text/html')) {
            const parsedTarget = new URL(targetUrl);
            const baseUrl = `${parsedTarget.protocol}//${parsedTarget.host}`;

            // Sapilitang i-route ang lahat ng links pabalik sa Render server para hindi mawala ang cloud signal
            body = body.replace(/href="(?!javascript:|mailto:|#)([^"]+)"/g, (match, url) => {
                try {
                    let absoluteUrl = new URL(url, baseUrl).href;
                    return `href="/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
                } catch (e) {
                    return match;
                }
            });

            body = body.replace(/src="(?!javascript:)([^"]+)"/g, (match, url) => {
                try {
                    let absoluteUrl = new URL(url, baseUrl).href;
                    return `src="/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
                } catch (e) {
                    return match;
                }
            });

            const topBar = `
                <div style="background:#030712;border-bottom:2px solid #34d399;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;font-family:sans-serif;position:sticky;top:0;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.8);">
                    <div style="display:flex;align-items:center;gap:6px;width:100%;">
                        <a href="/" style="background:#1e293b;color:#34d399;padding:6px 10px;border-radius:6px;font-size:11px;text-decoration:none;font-weight:bold;">⚡ Cloud Home</a>
                        <form action="/proxy" method="GET" style="display:flex;gap:4px;flex:1;margin:0;">
                            <input type="text" name="url" value="${targetUrl}" style="flex:1;height:30px;background:#090d16;border:1px solid #34d399;border-radius:6px;color:#fff;padding:0 8px;font-size:11px;outline:none;" />
                            <button type="submit" style="background:#34d399;border:none;color:#030712;font-weight:bold;padding:0 10px;height:30px;border-radius:6px;cursor:pointer;font-size:11px;">Go</button>
                        </form>
                    </div>
                </div>
            `;

            if (body.includes('<body')) {
                body = body.replace(/<body([^>]*)>/i, `<body$1>${topBar}`);
            } else {
                body = topBar + body;
            }
        }

        res.setHeader('Content-Type', contentType);
        res.send(body);
    } catch (err) {
        res.status(500).send(`
            <div style="background:#030712;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
                <h2 style="color:#f43f5e;margin-bottom:10px;">⚠ Cloud Signal Interrupted</h2>
                <p style="color:#94a3b8;font-size:12px;margin-bottom:20px;">Nagkaproblema ang Render server sa pagkuha ng data.</p>
                <a href="/browser" style="background:#34d399;color:#030712;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:12px;">Subukang Muli</a>
            </div>
        `);
    }
});

app.get('/browser', async (req, res) => {
    let queryUrl = req.query.url ? req.query.url.trim() : 'https://www.google.com';
    
    browserHistory.push({
        url: queryUrl,
        time: new Date().toLocaleTimeString()
    });
    if (browserHistory.length > 25) browserHistory.shift();

    res.redirect(`/proxy?url=${encodeURIComponent(queryUrl)}`);
});

app.get('/history', (req, res) => {
    let historyHtml = browserHistory.length === 0 
        ? '<p style="color:#94a3b8; font-size:11px; text-align:center; margin-top:20px;">Wala pang cloud history.</p>'
        : browserHistory.map(item => `
            <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08); padding:8px; border-radius:6px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <a href="/proxy?url=${encodeURIComponent(item.url)}" style="color:#34d399; font-size:10px; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">${item.url}</a>
                <span style="color:#64748b; font-size:8px;">${item.time}</span>
            </div>
        `).reverse().join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cloud History</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #030712; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .box { width: 100%; max-width: 380px; height: 100vh; background: #090d16; display: flex; flex-direction: column; padding: 16px; }
                @media(min-width: 420px) { .box { height: 90vh; border-radius: 24px; border: 6px solid #111827; } }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                .header h2 { font-size: 12px; color: #34d399; }
                .back { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .list { flex: 1; overflow-y: auto; }
            </style>
        </head>
        <body>
            <div class="box">
                <div class="header">
                    <h2>📦 Cloud History</h2>
                    <a href="/" class="back">⚡ Home</a>
                </div>
                <div class="list">${historyHtml}</div>
            </div>
        </body>
        </html>
    `);
});

app.get('/', async (req, res) => {
    const metrics = await getServerMetrics();
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Render Cloud Signal Controller</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .status-bar { height: 28px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 14px; font-size: 9px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .screen-area { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #064e3b 0%, #030712 100%); padding: 16px; justify-content: center; }
                .metrics-card { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(52, 211, 153, 0.3); padding: 10px; border-radius: 12px; margin-bottom: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
                .server-ip-text { color: #34d399; font-family: monospace; font-weight: bold; }
                .search-box-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
                .search-box-card h2 { font-size: 12px; color: #34d399; margin-bottom: 8px; }
                .search-box-card input { width: 100%; height: 36px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 11px; outline: none; margin-bottom: 8px; }
                .search-box-card button { width: 100%; height: 36px; background: linear-gradient(135deg, #34d399, #059669); border: none; border-radius: 8px; color: #030712; font-weight: bold; font-size: 11px; cursor: pointer; }
                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 10px; text-decoration: none; color: #e2e8f0; font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
                .link-btn span { font-size: 8px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="status-bar">
                    <span>12:00 PM</span>
                    <span>⚡ Cloud Server Signal Active</span>
                </div>
                <div class="screen-area">
                    <div class="metrics-card">
                        <div>Server Node: <span class="server-ip-text">${metrics.ip}</span></div>
                        <div>Signal: <span style="color:#34d399;">100% Cloud Power</span></div>
                    </div>
                    <div class="search-box-card">
                        <h2>⚡ Render Cloud Controller</h2>
                        <form action="/browser" method="GET">
                            <input type="text" name="url" placeholder="Maghanap o mag-paste ng URL..." />
                            <button type="submit">I-patakbo sa Cloud Server</button>
                        </form>
                    </div>
                    <div class="quick-links">
                        <a href="/browser?url=https://www.google.com" class="link-btn">
                            <strong style="color:#34d399;">🌐 Google Cloud</strong>
                            <span>Hawak ng Server ang Signal</span>
                        </a>
                        <a href="/history" class="link-btn" style="background: rgba(5, 150, 105, 0.2); border-color: rgba(52, 211, 153, 0.4);">
                            <strong style="color: #34d399;">Tingnan ang History</strong>
                            <span>Cloud Logs</span>
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Cloud Signal Controller running on port ${PORT}`);
});
        
