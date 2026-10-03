const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Listahan ng mga lehitimong Mobile User-Agents para sa anti-bot bypass
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

// 1. JSON API para sa IP at Bypass status check
app.get('/api/check-ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({
            success: true,
            server: "Render Cloud Server",
            serverIp: data.ip,
            status: "Active",
            bypassMode: "Full Mobile View Proxy + Random IP Rotation"
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Proxy endpoint para kunin at i-render ang mismong Facebook Mobile HTML
app.get('/proxy', async (req, res) => {
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

        let htmlText = await response.text();

        // Pag-ayos ng mga relative links para dumaan ulit sa ating proxy sa halip na masira
        htmlText = htmlText.replace(/href="\/watch\//g, 'href="/proxy?url=https://m.facebook.com/watch/');
        htmlText = htmlText.replace(/href="\/videos\//g, 'href="/proxy?url=https://m.facebook.com/videos/');
        htmlText = htmlText.replace(/href="\//g, 'href="https://m.facebook.com/');

        // Magdagdag ng maliit na Floating Bar sa itaas para makita ang IP at makapagpalit ng URL kung kailangan
        const toolbarHtml = `
            <div id="proxy-top-bar" style="position:fixed; top:0; left:0; width:100%; background:#18191a; color:#fff; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; z-index:999999; font-family:sans-serif; font-size:12px; border-bottom:1px solid #333;">
                <div><b>FB Mobile Proxy:</b> Active (IP: ${spoofedIP})</div>
                <div>
                    <a href="/" style="color:#2d88ff; text-decoration:none; margin-right:10px; font-weight:bold;">Home</a>
                    <button onclick="document.getElementById('proxy-top-bar').style.display='none'" style="background:#333; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Itago</button>
                </div>
            </div>
            <div style="height:40px;"></div>
        `;

        if (htmlText.includes('<body')) {
            htmlText = htmlText.replace('<body', toolbarHtml + '<body');
        } else {
            htmlText = toolbarHtml + htmlText;
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlText);

    } catch (err) {
        res.status(500).send(`May error sa pagkuha ng pahina: ${err.message}`);
    }
});

// 3. Main Dashboard UI (Kung saan ilalagay ang link o direktang bubuksan)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FB Watch Full Mobile UI Proxy</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #18191a; color: #e4e6eb; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; box-sizing: border-box; }
                .card { background: #242526; padding: 24px; border-radius: 12px; width: 100%; max-width: 450px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid #393a3b; text-align: center; }
                h2 { color: #2d88ff; margin-bottom: 8px; font-size: 22px; }
                p { font-size: 13px; color: #b0b3b8; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #393a3b; background: #3a3b3c; color: #fff; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 12px; }
                button { width: 100%; padding: 12px; background: #1877f2; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; }
                button:hover { background: #166fe5; }
                .ip-status { margin-top: 15px; font-size: 12px; color: #45bd62; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>FB Watch Full Mobile View</h2>
                <p>I-load ang orihinal na Facebook mobile watch interface sa pamamagitan ng server proxy.</p>
                
                <input type="text" id="targetUrl" value="https://m.facebook.com/watch/">
                <button onclick="openMobileView()">Buksan ang Facebook Mobile UI</button>
                
                <div class="ip-status" id="ipStatus">Checking server proxy status...</div>
            </div>

            <script>
                async function checkStatus() {
                    try {
                        const res = await fetch('/api/check-ip');
                        const data = await res.json();
                        if(data.success) {
                            document.getElementById('ipStatus').innerHTML = \`<b>Server IP:</b> \${data.serverIp}<br><i>Status: \${data.bypassMode}</i>\`;
                        }
                    } catch(e) {
                        document.getElementById('ipStatus').innerText = "Hindi nakontak ang status API.";
                    }
                }
                checkStatus();

                function openMobileView() {
                    const url = document.getElementById('targetUrl').value;
                    window.location.href = '/proxy?url=' + encodeURIComponent(url);
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`FB Full Mobile Proxy Server running on port ${PORT}`);
});
    
