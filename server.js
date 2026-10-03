const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());

// True Cloud OS Interface na may Phone Frame, Dynamic Dock, at Cloud Stream Viewport
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Cloud OS Pro - True Cloud Phone</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body, html { width: 100%; height: 100%; background-color: #05070b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                
                /* Real Phone Frame Design */
                .phone-container { width: 100vw; height: 100vh; max-width: 420px; max-height: 880px; background: #0f172a; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9); overflow: hidden; }
                @media(min-width: 450px) { .phone-container { border-radius: 44px; border: 10px solid #1e293b; height: 92vh; } }

                /* Phone Top Notch / Status Bar */
                .status-bar { height: 38px; background: rgba(15, 23, 42, 0.9); display: flex; justify-content: space-between; align-items: center; padding: 0 22px; font-size: 12px; font-weight: 600; color: #94a3b8; z-index: 10; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 130px; height: 22px; background: #1e293b; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; z-index: 11; }
                .status-icons { display: flex; gap: 6px; font-size: 10px; color: #38bdf8; }

                /* Main Screen Area / Home Launcher */
                .screen-area { flex: 1; position: relative; display: flex; flex-direction: column; overflow: hidden; background: radial-gradient(circle at center, #1e1b4b 0%, #090d16 100%); }
                .home-grid { flex: 1; padding: 35px 25px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; align-content: start; transition: opacity 0.3s ease; }
                
                .app-icon-card { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-decoration: none; }
                .app-icon-card:active { transform: scale(0.90); }
                .app-logo { width: 62px; height: 62px; border-radius: 20px; display: flex; justify-content: center; align-items: center; font-size: 26px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
                
                .yt-theme { background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; }
                .fb-theme { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; font-size: 24px; }
                .rbx-theme { background: linear-gradient(135deg, #334155, #0f172a); border: 2px solid #6366f1; color: white; font-size: 22px; }
                
                .app-title { font-size: 11px; margin-top: 8px; text-align: center; color: #cbd5e1; font-weight: 500; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

                /* Cloud Stream App Viewport (Iframe Container para sa Server-Powered Streaming) */
                .stream-viewport { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; display: none; flex-direction: column; z-index: 20; }
                .stream-header { height: 45px; background: #111827; display: flex; justify-content: space-between; align-items: center; padding: 0 15px; border-bottom: 1px solid #374151; }
                .back-btn { background: #374151; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; }
                .stream-title { font-size: 13px; color: #e5e7eb; font-weight: 600; }
                .stream-frame { flex: 1; width: 100%; border: none; background: #fff; }

                /* Phone Bottom Navigation Dock */
                .nav-dock { height: 65px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); z-index: 10; }
                .dock-btn { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 10px; transition: color 0.2s; }
                .dock-btn:hover { color: #38bdf8; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <!-- Top Notch & Status Bar -->
                <div class="notch"></div>
                <div class="status-bar">
                    <span id="clock">12:00 PM</span>
                    <div class="status-icons">
                        <span>☁ Cloud 5G</span>
                        <span>🔋 100%</span>
                    </div>
                </div>

                <!-- Screen Area -->
                <div class="screen-area">
                    <!-- Home Screen Grid -->
                    <div class="home-grid" id="homeGrid">
                        <!-- YouTube App -->
                        <div class="app-icon-card" onclick="openApp('https://m.youtube.com', 'YouTube Cloud')">
                            <div class="app-logo yt-theme">▶</div>
                            <span class="app-title">YouTube</span>
                        </div>

                        <!-- Facebook Videos App -->
                        <div class="app-icon-card" onclick="openApp('https://m.facebook.com/watch', 'FB Videos')">
                            <div class="app-logo fb-theme">🎬</div>
                            <span class="app-title">FB Videos</span>
                        </div>

                        <!-- Roblox Cloud Portal -->
                        <div class="app-icon-card" onclick="openApp('https://www.roblox.com/login', 'Roblox Cloud')">
                            <div class="app-logo rbx-theme">R</div>
                            <span class="app-title">Roblox</span>
                        </div>
                    </div>

                    <!-- In-App Cloud Stream Viewport -->
                    <div class="stream-viewport" id="streamViewport">
                        <div class="stream-header">
                            <button class="back-btn" onclick="closeApp()">‹ Home</button>
                            <span class="stream-title" id="streamTitle">Cloud App</span>
                            <span style="font-size: 10px; color: #10b981;">● Server Active</span>
                        </div>
                        <iframe class="stream-frame" id="streamFrame" src=""></iframe>
                    </div>
                </div>

                <!-- Bottom Navigation Dock -->
                <div class="nav-dock">
                    <button class="dock-btn" onclick="closeApp()">◀</button>
                    <button class="dock-btn" onclick="closeApp()">⌂</button>
                    <button class="dock-btn" onclick="closeApp()">▢</button>
                </div>
            </div>

            <script>
                // Clock Generator
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

                // Cloud App Streaming Handler (Server-Side Stream Simulation)
                function openApp(url, appName) {
                    const viewport = document.getElementById('streamViewport');
                    const frame = document.getElementById('streamFrame');
                    const title = document.getElementById('streamTitle');
                    
                    title.innerText = appName;
                    frame.src = url;
                    viewport.style.display = 'flex';
                }

                function closeApp() {
                    const viewport = document.getElementById('streamViewport');
                    const frame = document.getElementById('streamFrame');
                    
                    frame.src = ''; // I-stop ang stream para laging sariwa at magaan sa server
                    viewport.style.display = 'none';
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`True Cloud OS Server is running on port ${PORT}`);
});
              
