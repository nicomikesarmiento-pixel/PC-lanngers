const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ 
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
    frameguard: false 
}));
app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Proxy Route na may real-time server speed at metrics computation
app.all('/proxy', async (req, res) => {
    let targetUrl = req.query.url || req.body.url;
    
    if (!targetUrl) {
        return res.redirect('/');
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
            targetUrl = 'https://' + targetUrl;
        } else {
            targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(targetUrl);
        }
    }

    const startTime = performance.now();

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        const endTime = performance.now();
        const durationSec = (endTime - startTime) / 1000; // Oras na hinugot sa segundo

        let html = await response.text();
        const bytesLoaded = Buffer.byteLength(html, 'utf8');
        
        // Tunay na kalkulasyon ng bilis sa Mbps (Megabits per second) base sa laki ng nakuha at oras
        const megabits = (bytesLoaded * 8) / (1024 * 1024);
        const speedMbps = durationSec > 0 ? (megabits / durationSec).toFixed(2) : '0.00';
        const sizeKb = (bytesLoaded / 1024).toFixed(1);
        const timeTakenMs = (durationSec * 1000).toFixed(0);

        // Real-time server metrics toolbar sa itaas
        const toolbar = `
            <div style="position:fixed; top:0; left:0; width:100%; height:46px; background:#090d16; border-bottom:1px solid #334155; display:flex; align-items:center; padding:0 10px; z-index:999999; box-shadow:0 4px 10px rgba(0,0,0,0.8); font-family:sans-serif;">
                <form action="/proxy" method="GET" style="display:flex; width:100%; gap:6px; align-items:center;">
                    <a href="/" style="color:#38bdf8; text-decoration:none; font-size:11px; font-weight:bold;">🏠</a>
                    <input type="text" name="url" value="${targetUrl}" style="flex:1; height:28px; background:#1e293b; border:1px solid #475569; border-radius:4px; color:#fff; padding:0 8px; font-size:11px; outline:none;" />
                    <div style="background:#030712; border:1px solid #1e293b; border-radius:4px; padding:2px 6px; font-size:9px; color:#38bdf8; white-space:nowrap;">
                        ⚡ <b>${speedMbps} Mbps</b> | 📦 ${sizeKb} KB | ⏱️ ${timeTakenMs}ms
                    </div>
                    <button type="submit" style="background:#38bdf8; border:none; color:#0f172a; font-weight:bold; height:28px; padding:0 8px; border-radius:4px; font-size:11px; cursor:pointer;">Go</button>
                </form>
            </div>
            <div style="height:46px;"></div>
        `;

        if (html.includes('<body')) {
            html = html.replace('<body', toolbar + '<body');
        } else {
            html = toolbar + html;
        }

        res.send(html);
    } catch (error) {
        res.status(500).send(`
            <div style="font-family:sans-serif; padding:30px; background:#030712; color:#ef4444; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                <h3 style="font-size:18px; margin-bottom:10px;">Nabigo ang Server-Sided Fetch</h3>
                <p style="color:#cbd5e1; font-size:13px; margin-bottom:5px;">Sinubukang abutin: <b>${targetUrl}</b></p>
                <p style="color:#64748b; font-size:11px; margin-bottom:20px;">Error: ${error.message}</p>
                <a href="/" style="background:#38bdf8; color:#0f172a; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:12px;">Bumalik sa Home</a>
            </div>
        `);
    }
});

app.post('*', (req, res) => {
    res.redirect('/');
});

// Main Dashboard na may real network connection detector
app.get('/', (req, res) => {
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

                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); padding: 24px 20px; }
                
                .search-box-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; margin-bottom: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
                .search-box-card h2 { font-size: 14px; color: #38bdf8; margin-bottom: 10px; }
                .search-box-card input { width: 100%; height: 36px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; margin-bottom: 10px; }
                .search-box-card button { width: 100%; height: 36px; background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size: 12px; cursor: pointer; }

                .speed-card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
                .speed-card div { display: flex; flex-direction: column; }
                .speed-card span:first-child { font-size: 10px; color: #94a3b8; }
                .speed-card span:last-child { font-size: 13px; font-weight: bold; color: #38bdf8; }

                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; text-align: left; color: #e2e8f0; font-size: 12px; cursor: pointer; text-decoration: none; display: flex; flex-direction: column; gap: 4px; }
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
                    <span>☁️ Server-Sided Active</span>
                </div>

                <div class="screen-area">
                    <div class="search-box-card">
                        <h2>🌐 Server-Sided Browser</h2>
                        <form action="/proxy" method="GET">
                            <input type="text" name="url" placeholder="I-type ang URL o search query..." />
                            <button type="submit">Buksan sa Cloud Server</button>
                        </form>
                    </div>

                    <div class="speed-card">
                        <div>
                            <span>Local Device Status</span>
                            <span id="net-status">Nakakonekta sa Network</span>
                        </div>
                        <div style="text-align: right;">
                            <span>Client Speed API</span>
                            <span id="client-speed">Sinusukat...</span>
                        </div>
                    </div>

                    <div class="quick-links">
                        <a href="/proxy?url=https://myipaddress.com" class="link-btn">
                            <strong>Check IP</strong>
                            <span>Tingnan ang Server IP</span>
                        </a>
                        <a href="/proxy?url=https://html.duckduckgo.com/html/" class="link-btn">
                            <strong>DuckDuckGo</strong>
                            <span>Mag-browse via Server</span>
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

                // Real-time client connection check (Walang peke, ibabase sa tunay na browser API)
                function checkClientNetwork() {
                    if (!navigator.onLine) {
                        document.getElementById('net-status').innerText = "Wala kang Internet!";
                        document.getElementById('net-status').style.color = "#ef4444";
                        document.getElementById('client-speed').innerText = "0 Mbps (Offline)";
                        return;
                    }

                    // Kung sinusuportahan ng browser ang Network Information API
                    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                    if (connection && connection.downlink) {
                        document.getElementById('client-speed').innerText = connection.downlink + " Mbps (" + (connection.effectiveType || '4g') + ")";
                    } else {
                        document.getElementById('client-speed').innerText = "Aktibo (Standard)";
                    }
                }
                checkClientNetwork();
                window.addEventListener('online', checkClientNetwork);
                window.addEventListener('offline', checkClientNetwork);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server-Sided Proxy running on port ${PORT}`);
});
    
