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

// Cloud OS Interface na may Compact Phone Screen at Visible Buttons/Bars
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
                
                /* Phone Container Frame - Mas pinapaliit at fit para hindi maputol */
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 90vh; max-height: 760px; } }

                /* Status Bar */
                .status-bar { height: 32px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 10px; font-weight: 600; color: #9ca3af; z-index: 20; border-bottom: 1px solid rgba(255,255,255,0.02); flex-shrink: 0; }
                .camera-hole { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; background: #000; border-radius: 50%; z-index: 22; }
                .status-icons { display: flex; gap: 6px; font-size: 9px; color: #38bdf8; align-items: center; }

                /* Home Screen Grid */
                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; overflow-y: auto; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); }
                .home-grid { padding: 24px 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; align-content: start; }
                
                .app-icon-card { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-decoration: none; border: none; background: none; }
                .app-icon-card:active { transform: scale(0.88); transition: transform 0.1s; }
                .app-logo { width: 52px; height: 52px; border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 22px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); backdrop-filter: blur(12px); }
                
                .browser-theme { background: linear-gradient(135deg, #f97316, #c2410c); color: white; }
                .notes-theme { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
                .games-theme { background: linear-gradient(135deg, #10b981, #047857); color: white; font-size: 18px; }
                
                .app-title { font-size: 10px; margin-top: 6px; text-align: center; color: #e2e8f0; font-weight: 500; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

                /* In-App Browser Modal Viewer */
                #app-viewer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; z-index: 100; display: none; flex-direction: column; }
                .viewer-header { height: 46px; background: #1e293b; display: flex; align-items: center; padding: 0 10px; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
                .back-btn { background: #334155; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px; }
                .url-bar { flex: 1; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px 10px; font-size: 11px; color: #e5e7eb; outline: none; }
                .viewer-body { flex: 1; width: 100%; background: #0f172a; border: none; padding: 16px; overflow-y: auto; }

                /* Bottom Navigation Bar */
                .nav-dock { height: 48px; background: rgba(9, 13, 22, 0.95); backdrop-filter: blur(20px); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); z-index: 20; flex-shrink: 0; }
                .dock-btn { background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 8px; }
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
                        <!-- Custom Cloud Browser App -->
                        <button class="app-icon-card" onclick="openBrowser()">
                            <div class="app-logo browser-theme">🦆</div>
                            <span class="app-title">Duck Browser</span>
                        </button>

                        <!-- Notes App -->
                        <button class="app-icon-card" onclick="openNotes()">
                            <div class="app-logo notes-theme">📝</div>
                            <span class="app-title">Notes</span>
                        </button>

                        <!-- Games App -->
                        <button class="app-icon-card" onclick="openGames()">
                            <div class="app-logo games-theme">🎮</div>
                            <span class="app-title">Mini Games</span>
                        </button>
                    </div>
                </div>

                <!-- In-App Custom Browser / Viewer -->
                <div id="app-viewer">
                    <div class="viewer-header">
                        <button class="back-btn" onclick="closeApp()">‹ Home</button>
                        <input type="text" id="url-input" class="url-bar" value="https://duck.com/search" readonly />
                    </div>
                    <div id="viewer-content" class="viewer-body">
                        <!-- Dynamic Content Goes Here -->
                    </div>
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

                function openBrowser() {
                    document.getElementById('url-input').value = "https://duck.com/secure-search";
                    document.getElementById('viewer-content').innerHTML = \`
                        <div style="text-align: center; padding-top: 10px;">
                            <h2 style="color: #f97316; font-size: 20px; margin-bottom: 8px;">🦆 Duck Browser</h2>
                            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 20px;">Secure Cloud Proxy Search Engine</p>
                            <div style="display: flex; gap: 6px; max-width: 300px; margin: 0 auto;">
                                <input type="text" id="search-box" placeholder="Maghanap o i-type ang URL..." style="flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 12px; outline: none;">
                                <button onclick="alert('Naka-lock ang secure proxy connection sa Cloud Server.')" style="background: #f97316; color: white; border: none; padding: 0 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">🔍</button>
                            </div>
                            <div style="margin-top: 25px; text-align: left; background: #1e293b; padding: 12px; border-radius: 10px;">
                                <h4 style="color: #cbd5e1; font-size: 12px; margin-bottom: 6px;">Mga Paboritong Shortcuts:</h4>
                                <ul style="list-style: none; color: #38bdf8; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
                                    <li>🌐 <a href="#" onclick="alert('Protected proxy site.')" style="color: #38bdf8; text-decoration: none;">https://cloud-network-secure.internal</a></li>
                                    <li>⚡ <a href="#" onclick="alert('Server active connection OK.')" style="color: #38bdf8; text-decoration: none;">https://server-signal-tunnel.proxy</a></li>
                                </ul>
                            </div>
                        </div>
                    \`;
                    document.getElementById('app-viewer').style.display = 'flex';
                }

                function openNotes() {
                    document.getElementById('url-input').value = "cloud://notes/app";
                    document.getElementById('viewer-content').innerHTML = \`
                        <h2 style="color: #3b82f6; font-size: 18px; margin-bottom: 8px;">📝 Cloud Notes</h2>
                        <textarea style="width: 100%; height: 200px; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 10px; font-size: 12px; outline: none;" placeholder="Magsulat dito..."></textarea>
                    \`;
                    document.getElementById('app-viewer').style.display = 'flex';
                }

                function openGames() {
                    document.getElementById('url-input').value = "cloud://games/portal";
                    document.getElementById('viewer-content').innerHTML = \`
                        <h2 style="color: #10b981; font-size: 18px; margin-bottom: 8px;">🎮 Mini Games</h2>
                        <p style="color: #94a3b8; font-size: 12px;">Mag-enjoy sa mga cloud-rendered apps dito nang ligtas.</p>
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
           
