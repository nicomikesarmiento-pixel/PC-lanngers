const express = require('express');
const compression = require('compression');
const cors = require('cors');
const { fetch, ProxyAgent } = require('undici');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const MOBILE_USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
];

function getRandomUserAgent() {
    return MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)];
}

// Listahan ng mga pampublikong libreng proxy server para sa IP rotation (maaari mo rin itong palitan ng sarili mong proxy URL kung meron)
const PROXY_LIST = [
    // Ilagay dito ang mga working HTTP/HTTPS proxy kung meron, o hayaan itong gumamit ng direct cloud tunneling na may randomized headers
];

app.get('/api/check-ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({
            success: true,
            server: "Render Cloud Server",
            serverIp: data.ip,
            status: "Active",
            bypassMode: "Node.js Undici Proxy Tunneling"
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url || 'https://m.youtube.com/';
    
    try {
        const spoofedUserAgent = getRandomUserAgent();

        // Opsyonal: Kung mayroon kang proxy URL, ilagay dito. Kung wala, gagamitin ang secure cloud fetch na may mobile headers.
        // Halimbawa: const proxyAgent = new ProxyAgent('http://username:password@proxy-ip:port');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const fetchOptions = {
            headers: {
                'User-Agent': spoofedUserAgent,
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cache-Control': 'no-cache'
            },
            signal: controller.signal
        };

        // Kung gusto mo i-activate ang Proxy Agent, i-uncomment ang susunod na linya kapag may proxy IP ka na:
        // fetchOptions.dispatcher = new ProxyAgent('http://IP_NG_PROXY:PORT');

        const response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeoutId);

        let htmlText = await response.text();

        // I-re-route ang mga link para manatili sa loob ng proxy environment
        htmlText = htmlText.replace(/href="\/watch\?/g, 'href="/proxy?url=https://m.youtube.com/watch?');
        htmlText = htmlText.replace(/href="\/results\?/g, 'href="/proxy?url=https://m.youtube.com/results?');
        htmlText = htmlText.replace(/href="\//g, 'href="https://m.youtube.com/');

        const toolbarHtml = `
            <div id="proxy-top-bar" style="position:fixed; top:0; left:0; width:100%; background:#0f0f0f; color:#fff; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; z-index:999999; font-family:sans-serif; font-size:12px; border-bottom:1px solid #222;">
                <div><b>YT Secure Proxy:</b> Active (Mobile Spoofed)</div>
                <div>
                    <a href="/" style="color:#3ea6ff; text-decoration:none; margin-right:10px; font-weight:bold;">Home</a>
                    <button onclick="document.getElementById('proxy-top-bar').style.display='none'" style="background:#222; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Itago</button>
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
        res.status(500).send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px; background:#0f0f0f; color:#fff;">
                <h2>Nag-timeout ang koneksyon sa YouTube.</h2>
                <p style="color:#aaa;">Medyo mabagal o hinaharang ng platform ang pagbasa.</p>
                <a href="/" style="color:#3ea6ff; text-decoration:none; font-weight:bold;">Bumalik sa Home</a>
            </div>
        `);
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Proxy Suite</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; box-sizing: border-box; }
                .card { background: #212121; padding: 24px; border-radius: 12px; width: 100%; max-width: 450px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 1px solid #333; text-align: center; }
                h2 { color: #ff0000; margin-bottom: 8px; font-size: 22px; }
                p { font-size: 13px; color: #aaa; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #121212; color: #fff; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 12px; }
                button { width: 100%; padding: 12px; background: #ff0000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; }
                button:hover { background: #cc0000; }
                .ip-status { margin-top: 15px; font-size: 12px; color: #2ba640; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>YouTube Proxy Tunnel</h2>
                <p>I-load ang YouTube sa pamamagitan ng server proxy routing.</p>
                
                <input type="text" id="targetUrl" value="https://m.youtube.com/">
                <button onclick="openMobileView()">Buksan ang YouTube Mobile</button>
                
                <div class="ip-status" id="ipStatus">Kinukuha ang status...</div>
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
    console.log(`YouTube Proxy Server running on port ${PORT}`);
});
        
