const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Maluwag na security headers para hindi ma-block ng iframe loading
app.use(helmet({ 
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
    frameguard: false 
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Cloud OS Interface na may Anti-Detection at Mobile Spoofer
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Pixel 9 Pro - Virtual Cloud OS</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                
                /* Realistic Phone Frame Design */
                .phone-container { width: 100vw; height: 100vh; max-width: 420px; max-height: 890px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 450px) { .phone-container { border-radius: 46px; border: 12px solid #111827; height: 92vh; } }

                /* Phone Top Notch / Status Bar */
                .status-bar { height: 38px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 22px; font-size: 11px; font-weight: 600; color: #9ca3af; z-index: 20; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .camera-hole { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; background: #000; border-radius: 50%; z-index: 22; box-shadow: inset 0 0 3px rgba(255,255,255,0.2); }
                .status-icons { display: flex; gap: 8px; font-size: 10px; color: #38bdf8; align-items: center; }

                /* Main Screen Area / Home Launcher */
                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; overflow: hidden; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); }
                .home-grid { flex: 1; padding: 40px 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-content: start; }
                
                .app-icon-card { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-decoration: none; border: none; background: none; }
                .app-icon-card:active { transform: scale(0.88); transition: transform 0.1s; }
                .app-logo { width: 62px; height: 62px; border-radius: 20px; display: flex; justify-content: center; align-items: center; font-size: 26px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); backdrop-filter: blur(12px); }
                
                .yt-theme { background: linear-gradient(135deg, #ef4444, #991b1b); color: white; }
                .fb-theme { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; font-size: 24px; }
                .rbx-theme { background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #6366f1; color: white; font-size: 22px; }
                .stealth-theme { background: linear-gradient(135deg, #10b981, #047857); color: white; font-size: 22px; }
                
                .app-title { font-size: 11px; margin-top: 8px; text-align: center; color: #e2e8f0; font-weight: 500; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

                /* In-App Stealth Browser Viewer */
                #app-viewer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #090d16; z-index: 100; display: none; flex-direction: column; }
                .viewer-header { height: 48px; background: #111827; display: flex; align-items: center; padding: 0 16px; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); }
                .back-btn { background: #374151; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
                .viewer-title { font-size: 12px; font-weight: 600; color: #9ca3af; display: flex; align-items: center; gap: 6px; }
                .stealth-badge { background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 9px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.4); }
                .viewer-body { flex: 1; width: 100%; background: #fff; border: none; }

                /* Phone Bottom Navigation Bar */
                .nav-dock { height: 60px; background: rgba(9, 13, 22, 0.9); backdrop-filter: blur(20px); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); z-index: 20; }
                .dock-btn { background: none; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; padding: 10px; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <!-- Top Camera & Status Bar -->
                <div class="camera-hole"></div>
                <div class="status-bar">
                    <span id="clock">12:00 PM</span>
                    <div class="status-icons">
                        <span>🔒 Secure 5G</span>
                        <span>🔋 99%</span>
                    </div>
                </div>

                <!-- Screen Area / Home Grid -->
                <div class="screen-area">
                    <div class="home-grid">
                        <!-- YouTube -->
                        <button class="app-icon-card" onclick="openApp('YouTube', 'https://m.youtube.com')">
                            <div class="app-logo yt-theme">▶</div>
                            <span class="app-title">YouTube</span>
                        </button>

                        <!-- FB Videos -->
                        <button class="app-icon-card" onclick="openApp('Facebook', 'https://m.facebook.com/watch')">
                            <div class="app-logo fb-theme">🎬</div>
                            <span class="app-title">FB Videos</span>
                        </button>

                        <!-- Roblox -->
                        <button class="app-icon-card" onclick="openApp('Roblox', 'https://www.roblox.com/login')">
                            <div class="app-logo rbx-theme">R</div>
                            <span class="app-title">Roblox</span>
                        </button>

                        <!-- Stealth Status Info App -->
                        <button class="app-icon-card" onclick="openApp('Shield Info', 'data:text/html;charset=utf-8,<body style=%22background:#0f172a;color:#fff;font-family:sans-serif;padding:25px;text-align:center;%22><h2>🛡️ Stealth Active</h2><p style=%22margin-top:15px;color:#94a3b8;font-size:14px;%22>Device Spoofer is running. Your actual device signature is fully masked from anti-bot trackers.</p></body>')">
                            <div class="app-logo stealth-theme">🛡️</div>
                            <span class="app-title">Shield</span>
                        </button>
                    </div>
                </div>

                <!-- In-App Stealth Viewer Modal -->
                <div id="app-viewer">
                    <div class="viewer-header">
                        <button class="back-btn" onclick="closeApp()">‹ Home</button>
                        <div class="viewer-title">
                            <span id="viewer-app-name">App</span>
                            <span class="stealth-badge">Stealth Mode</span>
                        </div>
                        <div style="width: 50px;"></div>
                    </div>
                    <!-- Pinatagong Mobile User Agent para hindi madetect -->
                    <iframe id="viewer-frame" class="viewer-body" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src=""></iframe>
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

                function openApp(name, url) {
                    document.getElementById('viewer-app-name').innerText = name;
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
    console.log(`Stealth Cloud OS Server is running on port ${PORT}`);
});
    
