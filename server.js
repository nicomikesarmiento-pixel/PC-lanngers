const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance Middlewares
app.use(helmet({ 
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
    frameguard: false 
}));
app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function para makuha ang Public IP ng Render Server
async function getServerIp() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return '74.220.48.219'; // Fallback IP kung sakaling mag-timeout
    }
}

// Smart Proxy Handler na may Bottom Search Bar lamang at Speed Optimization
app.all('/fetch-proxy', async (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl && req.body) {
        targetUrl = req.body.url || req.body.q || req.body.query;
    }

    if (!targetUrl) return res.redirect('/');

    targetUrl = targetUrl.trim();

    // Matalinong pagsusuri ng URL o Search Query
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        const lowerUrl = targetUrl.toLowerCase();
        
        if (lowerUrl === 'youtube' || lowerUrl === 'yt') {
            targetUrl = 'https://m.youtube.com';
        } else if (lowerUrl === 'google') {
            targetUrl = 'https://www.google.com';
        } else if (lowerUrl === 'includes' || (lowerUrl.includes('.') && !lowerUrl.includes(' ') && !lowerUrl.startsWith('/'))) {
            targetUrl = 'https://' + targetUrl;
        } else if (lowerUrl.includes('.') && !lowerUrl.includes(' ')) {
            targetUrl = 'https://' + targetUrl;
        } else {
            targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(targetUrl);
        }
    }

    // Fix para sa maling condition sa taas kung sakaling dumaan sa tuldok
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
            targetUrl = 'https://' + targetUrl;
        } else {
            targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(targetUrl);
        }
    }

    const startTime = Date.now();
    const currentServerIp = await getServerIp();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        let htmlContent = await response.text();
        const contentLength = Buffer.byteLength(htmlContent, 'utf8');
        
        const speedMbps = ((contentLength * 8) / (duration > 0 ? duration : 1) / 1000).toFixed(2);
        const sizeKB = (contentLength / 1024).toFixed(1);

        // Minimalist top indicator lamang (walang search bar sa itaas), at Professional Search Bar sa ibaba
        const injectedHtml = `
            <!DOCTYPE html>
            <html lang="tl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Server-Sided Browser Preview</title>
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

                    /* Professional Search Bar sa Ibaba Lamang */
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
                        <span class="ip-badge">🌐 IP: ${currentServerIp}</span>
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
        res.status(500).send(`
            <div style="background:#030712; color:#fff; padding:50px 20px; font-family:sans-serif; text-align:center; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h2 style="color:#f43f5e; font-size:20px; margin-bottom:10px;">⚠️ Na-timeout o Nabigo ang Server</h2>
                <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">Masyadong mabagal sumagot o hinaharangan ng target website ang server.</p>
                <a href="/" style="background:#38bdf8; color:#0f172a; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">Bumalik sa Home</a>
            </div>
        `);
    }
});

// Main Cloud Phone OS Interface (Home Screen)
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
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; max-height: 760px; } }

                .status-bar { height: 32px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 10px; font-weight: 600; color: #9ca3af; z-index: 20; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .camera-hole { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; background: #000; border-radius: 50%; z-index: 22; }

                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); padding: 20px; overflow-y: auto; }
                
                .metrics-card { display: flex; flex-direction: column; gap: 4px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px 14px; border-radius: 12px; margin-bottom: 12px; font-size: 10px; color: #94a3b8; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                .metrics-card b { color: #38bdf8; }
                .server-ip-text { color: #34d399; font-family: monospace; font-weight: bold; }

                .search-box-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; margin-bottom: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
                .search-box-card h2 { font-size: 14px; color: #38bdf8; margin-bottom: 10px; }
                .search-box-card input { width: 100%; height: 38px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; margin-bottom: 10px; }
                .search-box-card button { width: 100%; height: 38px; background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size: 12px; cursor: pointer; }

                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 12px; text-align: left; color: #e2e8f0; font-size: 12px; cursor: pointer; text-decoration: none; display: flex; flex-direction: column; gap: 4px; }
                .link-btn span { font-size: 10px; color: #94a3b8; }

                .nav-dock { height: 48px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); }
                .dock-btn { background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="camera-hole"></div>
                <div class="status-bar">
                    <span id="clock">12:00 PM</span>
                    <span>☁️ Server-Sided Core</span>
                </div>

                <div class="screen-area">
                    <div class="metrics-card">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Status: <b>Online (Render)</b></span>
                            <span>Client Speed: <b>Fast Proxy</b></span>
                        </div>
                        <div>Render Server IP: <span class="server-ip-text">${serverIp}</span></div>
                    </div>

                    <div class="search-box-card">
                        <h2>🌐 Server-Sided Browser</h2>
                        <form action="/fetch-proxy" method="GET">
                            <input type="text" name="url" placeholder="I-type ang YouTube, URL, o salita..." />
                            <button type="submit">Buksan sa Cloud Server</button>
                        </form>
                    </div>

                    <div class="quick-links">
                        <a href="/fetch-proxy?url=https://html.duckduckgo.com/html/" class="link-btn">
                            <strong>DuckDuckGo</strong>
                            <span>Mag-browse via Server</span>
                        </a>
                        <a href="/fetch-proxy?url=https://api.ipify.org" class="link-btn">
                            <strong>Check IP</strong>
                            <span>Tingnan ang Server IP</span>
                        </a>
                    </div>
                </div>

                <div class="nav-dock">
                    <button class="dock-btn">◀</button>
                    <button class="dock-btn">⌂</button>
                    <button class="dock-btn">▢</button>
                </div>
            </div>

            <script>
                function updateClock() {
                    const now = new Date();
                    let hours = now.getHours();
                    const minutes = now.getMinutes().toString().padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
                    document.getElementById('clock').innerText = hours + ':' + minutes + ' ' + ampm;
                }
                setInterval(updateClock, 1000);
                updateClock();
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Cloud Server running on port ${PORT}`);
});
    
