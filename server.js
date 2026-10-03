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

// Cloud OS Interface na may Sariling Built-in Browser Viewer
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Cloud OS Pro - Virtual Phone</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                
                /* Phone Container Frame */
                .phone-container { width: 100vw; height: 100vh; max-width: 420px; max-height: 890px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 450px) { .phone-container { border-radius: 46px; border: 12px solid #111827; height: 92vh; } }

                /* Status Bar */
                .status-bar { height: 38px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 22px; font-size: 11px; font-weight: 600; color: #9ca3af; z-index: 20; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .camera-hole { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; background: #000; border-radius: 50%; z-index: 22; }
                .status-icons { display: flex; gap: 8px; font-size: 10px; color: #38bdf8; align-items: center; }

                /* Home Screen Grid */
                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; overflow: hidden; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); }
                .home-grid { flex: 1; padding: 40px 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-content: start; }
                
                .app-icon-card { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-decoration: none; border: none; background: none; }
                .app-icon-card:active { transform: scale(0.88); transition: transform 0.1s; }
                .app-logo { width: 62px; height: 62px; border-radius: 20px; display: flex; justify-content: center; align-items: center; font-size: 26px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); backdrop-filter: blur(12px); }
                
                .browser-theme { background: linear-gradient(135deg, #f97316, #c2410c); color: white; }
                .duck-theme { background: linear-gradient(135deg, #eab308, #ca8a04); color: white; }
                .wiki-theme { background: linear-gradient(135deg, #475569, #1e293b); color: white; font-size: 22px; }
                
                .app-title { font-size: 11px; margin-top: 8px; text-align: center; color: #e2e8f0; font-weight: 500; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

                /* In-App Browser Modal Viewer (Laging nasa loob ng Cloud Phone) */
                #app-viewer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #090d16; z-index: 100; display: none; flex-direction: column; }
                .viewer-header { height: 50px; background: #111827; display: flex; align-items: center; padding: 0 12px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
                .back-btn { background: #374151; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; }
                .url-bar { flex: 1; background: #1f2937; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #e5e7eb; outline: none; }
                .viewer-body { flex: 1; width: 100%; background: #fff; border: none; }

                /* Bottom Navigation Bar */
                .nav-dock { height: 60px; background: rgba(9, 13, 22, 0.9); backdrop-filter: blur(20px); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); z-index: 20; }
                .dock-btn { background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; padding: 10px; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <!-- Camera & Status Bar -->
                <div class="camera-hole"></div>
                <div class="status-bar">
                    <span id="clock">12:00 PM</span>
                    <div class="status-icons">
                        <span>🔒 Cloud Net</span>
                        <span>🔋 100%</span>
                    </div>
                </div>

                <!-- Home Screen Apps -->
                <div class="screen-area">
                    <div class="home-grid">
                        <!-- DuckDuckGo Browser App -->
                        <button class="app-icon-card" onclick="openApp('https://duck.com', 'Duck Browser')">
                            <div class="app-logo browser-theme">🦆</div>
                            <span class="app-title">Duck Browser</span>
                        </button>

                        <!-- Google Search App -->
                        <button class="app-icon-card" onclick="openApp('https://www.google.com/ncr', 'Google Search')">
                            <div class="app-logo duck-theme">🌐</div>
                            <span class="app-title">Google</span>
                        </button>

                        <!-- Wikipedia App -->
                        <button class="app-icon-card" onclick="openApp('https://www.wikipedia.org', 'Wikipedia')">
                            <div class="app-logo wiki-theme">📖</div>
                            <span class="app-title">Wiki</span>
                        </button>
                    </div>
                </div>

                <!-- In-App Secured Browser Viewer -->
                <div id="app-viewer">
                    <div class="viewer-header">
                        <button class="back-btn" onclick="closeApp()">‹ Home</button>
                        <input type="text" id="url-input" class="url-bar" readonly />
                    </div>
                    <iframe id="viewer-frame" class="viewer-body" src=""></iframe>
                </div>

                <!-- Bottom Navigation Bar -->
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

                function openApp(url, title) {
                    document.getElementById('url-input').value = title + ' (' + url + ')';
                    document.getElementById('viewer-frame').src = url;
                    document.getElementById('app-viewer').style.display = 'flex';
                }

                function closeApp() {
                    document.getElementById('app-viewer').style.display = 'none';
                    document.getElementById('viewer-frame').src = '';
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Cloud OS Server running on port ${PORT}`);
});

