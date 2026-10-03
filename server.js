const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper para sa Server IP
async function getServerIp() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) {
        return '74.220.48.219';
    }
}

// Puppeteer Core Proxy Route na may Bottom Search Bar lamang
app.all('/fetch-proxy', async (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl && req.body) {
        targetUrl = req.body.url || req.body.q || req.body.query;
    }

    if (!targetUrl) return res.redirect('/');
    targetUrl = targetUrl.trim();

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        const lowerUrl = targetUrl.toLowerCase();
        if (lowerUrl === 'youtube' || lowerUrl === 'yt') {
            targetUrl = 'https://www.youtube.com';
        } else if (lowerUrl === 'google') {
            targetUrl = 'https://www.google.com';
        } else if (lowerUrl.includes('.') && !lowerUrl.includes(' ')) {
            targetUrl = 'https://' + targetUrl;
        } else {
            targetUrl = 'https://www.google.com/search?q=' + encodeURIComponent(targetUrl);
        }
    }

    let browser = null;
    const startTime = Date.now();
    const currentServerIp = await getServerIp();

    try {
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || chromium.path || '/usr/bin/google-chrome';

        browser = await puppeteer.launch({
            executablePath: executablePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 380, height: 700, isMobile: true });
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36');

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        let htmlContent = await page.content();
        await browser.close();

        const duration = Date.now() - startTime;
        const sizeKB = (Buffer.byteLength(htmlContent, 'utf8') / 1024).toFixed(1);
        const speedMbps = ((Buffer.byteLength(htmlContent, 'utf8') * 8) / (duration > 0 ? duration : 1) / 1000).toFixed(2);

        const injectedHtml = `
            <!DOCTYPE html>
            <html lang="tl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Server Browser - Puppeteer Core</title>
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

                    body { margin-top: 40px !important; margin-bottom: 65px !important; }
                </style>
            </head>
            <body>
                <div id="cloud-top-bar">
                    <a href="/" class="back-home">🏠 Home</a>
                    <div class="metrics">
                        <span>⚡ ${speedMbps} Mbps | 📦 ${sizeKB} KB</span>
                        <span class="ip-badge">🌐 Server IP: ${currentServerIp}</span>
                    </div>
                </div>

                ${htmlContent}

                <div id="bottom-search-bar">
                    <form action="/fetch-proxy" method="GET">
                        <input type="text" name="url" placeholder="Mag-search o mag-type ng URL dito..." />
                        <button type="submit">Hanapin sa Server</button>
                    </form>
                </div>
            </body>
            </html>
        `;

        res.send(injectedHtml);

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).send(`
            <div style="background:#030712; color:#fff; padding:50px 20px; font-family:sans-serif; text-align:center; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h2 style="color:#f43f5e; font-size:20px; margin-bottom:10px;">⚠️ Nabigo ang Server Browser</h2>
                <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">${error.message}</p>
                <a href="/" style="background:#38bdf8; color:#0f172a; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">Bumalik sa Home</a>
            </div>
        `);
    }
});

// Home Dashboard
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
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="status-bar">
                    <span>12:00 PM</span>
                    <span>☁️ Puppeteer Core</span>
                </div>
                <div class="screen-area">
                    <div class="metrics-card">
                        <div>Status: <b>Online (Puppeteer Core)</b></div>
                        <div>Server IP: <span class="server-ip-text">${serverIp}</span></div>
                    </div>
                    <div class="search-box-card">
                        <h2>🌐 Cloud Browser</h2>
                        <form action="/fetch-proxy" method="GET">
                            <input type="text" name="url" placeholder="I-type ang YouTube, Google, o URL..." />
                            <button type="submit">Buksan gamit ang Server Browser</button>
                        </form>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Puppeteer Core Server running on port ${PORT}`);
});
