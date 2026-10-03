const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Dito natin ise-save sa RAM ng Server ang history ng mga hinahanap mo
let searchHistory = [];

async function getServerIp() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return '74.220.48.219';
    }
}

// Route para ipakita ang Server-Side History
app.get('/history', (req, res) => {
    let historyListHtml = searchHistory.length === 0 
        ? '<p style="color:#94a3b8; font-size:12px; text-align:center; margin-top:20px;">Wala pang history sa server.</p>' 
        : searchHistory.map(item => `
            <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:220px;">
                    <a href="/fetch-proxy?url=${encodeURIComponent(item.url)}" style="color:#38bdf8; text-decoration:none; font-size:11px; font-weight:bold;">${item.query}</a>
                    <div style="color:#64748b; font-size:9px; margin-top:2px;">${item.time}</div>
                </div>
                <span style="background:#0284c7; color:#fff; font-size:8px; padding:2px 6px; border-radius:4px;">Server</span>
            </div>
        `).reverse().join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Server History</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { width: 100vw; height: 100vh; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; }
                .container { width: 100%; max-width: 380px; height: 100vh; max-height: 740px; background: #090d16; display: flex; flex-direction: column; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.95); }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
                .header h2 { font-size: 14px; color: #38bdf8; }
                .back-btn { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .history-list { flex: 1; overflow-y: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📦 Server History</h2>
                    <a href="/" class="back-btn">Bumalik</a>
                </div>
                <div class="history-list">
                    ${historyListHtml}
                </div>
            </div>
        </body>
        </html>
    `);
});

// Proxy Route na nagtatala sa Server History
app.all('/fetch-proxy', async (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl && req.body) {
        targetUrl = req.body.url || req.body.q || req.body.query;
    }

    if (!targetUrl) return res.redirect('/');
    targetUrl = targetUrl.trim();

    let searchQuery = targetUrl;

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        const lowerUrl = targetUrl.toLowerCase();
        if (lowerUrl === 'youtube' || lowerUrl === 'yt') {
            targetUrl = 'https://m.youtube.com';
        } else if (lowerUrl === 'google') {
            targetUrl = 'https://www.google.com';
        } else if (lowerUrl.includes('.') && !lowerUrl.includes(' ')) {
            targetUrl = 'https://' + targetUrl;
        } else {
            targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(targetUrl);
        }
    }

    // I-save agad sa Server History RAM
    searchHistory.push({
        query: searchQuery,
        url: targetUrl,
        time: new Date().toLocaleTimeString()
    });

    // Panatilihing hanggang 50 items lang para hindi bumigat ang server
    if (searchHistory.length > 50) searchHistory.shift();

    const startTime = Date.now();
    const currentServerIp = await getServerIp();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        let htmlContent = await response.text();
        const contentLength = Buffer.byteLength(htmlContent, 'utf8');
        
        const speedMbps = ((contentLength * 8) / (duration > 0 ? duration : 1) / 1000).toFixed(2);
        const sizeKB = (contentLength / 1024).toFixed(1);

        const injectedHtml = `
            <!DOCTYPE html>
            <html lang="tl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Server Browser</title>
                <style>
                    #cloud-top-bar {
                        position: fixed; top: 0; left: 0; width: 100%; height: 35px;
                        background: rgba(9, 13, 22, 0.95); backdrop-filter: blur(10px);
                        border-bottom: 1px solid rgba(255,255,255,0.08); display: flex;
                        align-items: center; justify-content: space-between; padding: 0 12px;
                        z-index: 999999; font-family: sans-serif; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    }
                    .back-home { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                    .metrics { font-size: 9px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
                    .ip-badge { background: #0284c7; color: #fff; padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: bold; font-family: monospace; }

                    #bottom-search-bar {
                        position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(9, 13, 22, 0.98);
                        backdrop-filter: blur(10px); border-top: 1px solid rgba(255,255,255,0.1); padding: 10px 15px;
                        display: flex; gap: 8px; z-index: 999999; box-shadow: 0 -4px 15px rgba(0,0,0,0.6);
                    }
                    #bottom-search-bar form { display: flex; width: 100%; gap: 8px; }
                    #bottom-search-bar input {
                        flex: 1; height: 38px; background: #0f172a; border: 1px solid #475569;
                        border-radius: 8px; color: #fff; padding: 0 12px; font-size: 12px; outline: none;
                    }
                    #bottom-search-bar button {
                        background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px;
                        color: #0f172a; font-weight: bold; padding: 0 16px; font-size: 11px; cursor: pointer;
                    }
                    body { margin-top: 40px !important; margin-bottom: 65px !important; background: #fff !important; }
                </style>
            </head>
            <body>
                <div id="cloud-top-bar">
                    <a href="/" class="back-home">🏠 Home</a>
                    <div class="metrics">
                        <span>⚡ ${speedMbps} Mbps</span>
                        <span class="ip-badge">Server IP</span>
                    </div>
                </div>

                ${htmlContent}

                <div id="bottom-search-bar">
                    <form action="/fetch-proxy" method="GET">
                        <input type="text" name="url" placeholder="Mag-search o mag-type ng URL..." />
                        <button type="submit">Hanapin</button>
                    </form>
                </div>
            </body>
            </html>
        `;

        res.send(injectedHtml);
    } catch (error) {
        res.status(500).send(`
            <div style="background:#030712; color:#fff; padding:50px 20px; font-family:sans-serif; text-align:center; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h2 style="color:#f43f5e; font-size:18px; margin-bottom:10px;">⚠️ Nabigo ang Connection</h2>
                <a href="/" style="background:#38bdf8; color:#0f172a; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">Bumalik sa Home</a>
            </div>
        `);
    }
});

// Home Dashboard na may History Button
app.get('/', async (req, res) => {
    const serverIp = await getServerIp();
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Server-Sided Cloud OS</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .status-bar { height: 32px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 10px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .screen-area { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); padding: 20px; overflow-y: auto; }
                .metrics-card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px 14px; border-radius: 12px; margin-bottom: 12px; font-size: 10px; color: #94a3b8; }
                .metrics-card b { color: #38bdf8; }
                .server-ip-text { color: #34d399; font-family: monospace; font-weight: bold; }
                .search-box-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; margin-bottom: 15px; }
                .search-box-card h2 { font-size: 14px; color: #38bdf8; margin-bottom: 10px; }
                .search-box-card input { width: 100%; height: 38px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; margin-bottom: 10px; }
                .search-box-card button { width: 100%; height: 38px; background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size: 12px; cursor: pointer; }
                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; text-align: left; color: #e2e8f0; font-size: 11px; cursor: pointer; text-decoration: none; display: flex; flex-direction: column; gap: 4px; }
                .link-btn span { font-size: 9px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="status-bar">
                    <span>12:00 PM</span>
                    <span>☁️ Cloud OS</span>
                </div>
                <div class="screen-area">
                    <div class="metrics-card">
                        <div>Status: <b>Online (Server History Enabled)</b></div>
                        <div>Server IP: <span class="server-ip-text">${serverIp}</span></div>
                    </div>
                    <div class="search-box-card">
                        <h2>🌐 Cloud Browser</h2>
                        <form action="/fetch-proxy" method="GET">
                            <input type="text" name="url" placeholder="Mag-search o mag-type ng URL..." />
                            <button type="submit">Buksan sa Server</button>
                        </form>
                    </div>
                    <div class="quick-links">
                        <a href="/fetch-proxy?url=https://html.duckduckgo.com/html/" class="link-btn">
                            <strong>DuckDuckGo</strong>
                            <span>Search Engine</span>
                        </a>
                        <a href="/history" class="link-btn" style="background: rgba(2, 132, 199, 0.2); border-color: rgba(56, 189, 248, 0.4);">
                            <strong style="color: #38bdf8;">Tingnan ang History</strong>
                            <span>Naka-save sa Server</span>
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
                                                
