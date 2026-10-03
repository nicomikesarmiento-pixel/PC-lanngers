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
app.use(express.json());

// Universal Cloud Proxy Router: Ang Render Server ang kokonekta sa kahit anong hinanap mo
app.get('/cloud-engine', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Walang URL na ibinigay.');

    // Kung salita ang tinype (hindi URL), awtomatikong ididirekta sa DuckDuckGo HTML search engine
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(targetUrl);
    }

    try {
        // Ang Cloud Server ang gagawa ng buong trabaho at internet request
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            redirect: 'follow'
        });

        let html = await response.text();
        
        // Inaayos natin ang mga relative links sa HTML para manatili silang dumadaloy sa Cloud Server
        const baseObj = new URL(response.url);
        const baseUrl = `${baseObj.protocol}//${baseObj.host}`;
        
        // Ibinabalik natin ang nalinisan at na-render na pahina papunta sa phone mo bilang viewer screen lang
        res.send(`
            <!DOCTYPE html>
            <html lang="tl">
            <head>
                <meta charset="UTF-8">
                <base href="${baseUrl}/">
                <title>Cloud Engine View</title>
                <style>
                    body { margin: 0; background: #fff; font-family: sans-serif; }
                </style>
            </head>
            <body>
                ${html}
                <script>
                    // Ginagawa nating cloud-routed ang lahat ng link at form submission para hindi sumablay sa GET/POST
                    document.querySelectorAll('a').forEach(a => {
                        const href = a.getAttribute('href');
                        if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                            const absoluteUrl = new URL(href, document.baseURI).href;
                            a.onclick = (e) => {
                                e.preventDefault();
                                window.parent.loadCloudUrl(absoluteUrl);
                            };
                        }
                    });

                    document.querySelectorAll('form').forEach(form => {
                        form.onsubmit = (e) => {
                            e.preventDefault();
                            const formData = new FormData(form);
                            const actionUrl = new URL(form.getAttribute('action') || window.location.href, document.baseURI).href;
                            const params = new URLSearchParams(formData).toString();
                            const finalTarget = actionUrl.includes('?') ? actionUrl + '&' + params : actionUrl + '?' + params;
                            window.parent.loadCloudUrl(finalTarget);
                        };
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.send(`
            <div style="padding: 20px; font-family: sans-serif; background: #0f172a; color: #fff; text-align: center;">
                <h3>⚠️ Cloud Server Engine Notice</h3>
                <p>Hindi maabot ng Cloud Server ang pahinang ito: ${error.message}</p>
                <a href="/" style="color: #38bdf8;">Bumalik sa Home</a>
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Cloud OS Pro - Remote Cloud Phone</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; max-height: 760px; } }

                .status-bar { height: 32px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 10px; font-weight: 600; color: #9ca3af; z-index: 20; border-bottom: 1px solid rgba(255,255,255,0.02); flex-shrink: 0; }
                .camera-hole { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; background: #000; border-radius: 50%; z-index: 22; }
                .status-icons { display: flex; gap: 6px; font-size: 9px; color: #38bdf8; align-items: center; }

                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; overflow-y: auto; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); }
                .home-grid { padding: 24px 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; align-content: start; }
                
                .app-icon-card { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-decoration: none; border: none; background: none; }
                .app-icon-card:active { transform: scale(0.88); transition: transform 0.1s; }
                .app-logo { width: 52px; height: 52px; border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 22px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); backdrop-filter: blur(12px); }
                
                .browser-theme { background: linear-gradient(135deg, #f97316, #c2410c); color: white; }
                .notes-theme { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
                .games-theme { background: linear-gradient(135deg, #10b981, #047857); color: white; font-size: 18px; }
                
                .app-title { font-size: 10px; margin-top: 6px; text-align: center; color: #e2e8f0; font-weight: 500; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

                #app-viewer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; z-index: 100; display: none; flex-direction: column; }
                .viewer-header { height: 46px; background: #1e293b; display: flex; align-items: center; padding: 0 10px; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
                .back-btn { background: #334155; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px; }
                .url-bar { flex: 1; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px 10px; font-size: 11px; color: #e5e7eb; outline: none; }
                .viewer-body { flex: 1; width: 100%; background: #0f172a; border: none; display: flex; flex-direction: column; }

                .nav-dock { height: 48px; background: rgba(9, 13, 22, 0.95); backdrop-filter: blur(20px); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); z-index: 20; flex-shrink: 0; }
                .dock-btn { background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 8px; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="camera-hole"></div>
                <div class="status-bar">
                    <span id="clock">12:00 PM</span>
                    <div class="status-icons">
                        <span>☁️ Cloud Stream</span>
                        <span>🔋 100%</span>
                    </div>
                </div>

                <div class="screen-area">
                    <div class="home-grid">
                        <button class="app-icon-card" onclick="openBrowser('https://html.duckduckgo.com/html/')">
                            <div class="app-logo browser-theme">🦆</div>
                            <span class="app-title">Duck Browser</span>
                        </button>
                        <button class="app-icon-card" onclick="openNotes()">
                            <div class="app-logo notes-theme">📝</div>
                            <span class="app-title">Notes</span>
                        </button>
                        <button class="app-icon-card" onclick="openGames()">
                            <div class="app-logo games-theme">🎮</div>
                            <span class="app-title">Mini Games</span>
                        </button>
                    </div>
                </div>

                <div id="app-viewer">
                    <div class="viewer-header">
                        <button class="back-btn" onclick="closeApp()">‹ Home</button>
                        <input type="text" id="url-input" class="url-bar" placeholder="Mag-type ng URL o Search..." onkeydown="if(event.key === 'Enter') loadCloudUrl(this.value)" />
                    </div>
                    <div id="viewer-content" class="viewer-body"></div>
                </div>

                <div class="nav-dock">
                    <button class="dock-btn" onclick="closeApp()">◀</button>
                    <button class="dock-btn" onclick="closeApp()">⌂</button>
                    <button class="dock-btn" onclick="closeApp()">▢</button>
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

                function openBrowser(targetUrl) {
                    document.getElementById('app-viewer').style.display = 'flex';
                    loadCloudUrl(targetUrl);
                }

                function loadCloudUrl(url) {
                    document.getElementById('url-input').value = url;
                    const proxyStreamUrl = '/cloud-engine?url=' + encodeURIComponent(url);
                    
                    document.getElementById('viewer-content').innerHTML = \`
                        <iframe src="\${proxyStreamUrl}" style="width: 100%; flex: 1; border: none; background: #fff;"></iframe>
                    \`;
                }

                function openNotes() {
                    document.getElementById('url-input').value = "cloud://notes/app";
                    document.getElementById('viewer-content').innerHTML = \`
                        <div style="padding: 15px; flex: 1; background: #0f172a;">
                            <h2 style="color: #3b82f6; font-size: 16px; margin-bottom: 6px;">📝 Cloud Notes</h2>
                            <textarea style="width: 100%; height: calc(100% - 30px); background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 10px; font-size: 11px; outline: none;" placeholder="Magsulat dito..."></textarea>
                        </div>
                    \`;
                    document.getElementById('app-viewer').style.display = 'flex';
                }

                function openGames() {
                    document.getElementById('url-input').value = "cloud://games/portal";
                    document.getElementById('viewer-content').innerHTML = \`
                        <div style="padding: 15px; flex: 1; background: #0f172a;">
                            <h2 style="color: #10b981; font-size: 16px; margin-bottom: 6px;">🎮 Mini Games</h2>
                            <p style="color: #94a3b8; font-size: 11px;">Mag-enjoy sa mga cloud-rendered apps dito nang ligtas.</p>
                        </div>
                    \`;
                    document.getElementById('app-viewer').style.display = 'flex';
                }

                function closeApp() {
                    document.getElementById('app-viewer').style.display = 'none';
                    document.getElementById('viewer-content').innerHTML = '';
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Cloud OS Server running on port ${PORT}`);
});
