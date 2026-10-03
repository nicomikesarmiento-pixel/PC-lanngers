const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Magaan na Server History na may auto-cleanup para hindi maubusan ng limit/RAM
let searchHistory = [];

async function getServerIp() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return 'Render Cloud Active';
    }
}

// Pangkalahatang Server-Side Search & Proxy Route para sa lahat ng uri ng hinahanap
app.get('/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) return res.redirect('/');

    const serverIp = await getServerIp();

    // I-save sa server history at panatilihing maximum na 30 items lang para hindi mapuno ang memory limit
    searchHistory.push({
        query: query,
        time: new Date().toLocaleTimeString()
    });
    if (searchHistory.length > 30) searchHistory.shift();

    let contentOutput = '';

    // Kung YouTube-related ang hinahanap, i-embed ang video search player
    if (query.toLowerCase().includes('music') || query.toLowerCase().includes('video') || query.toLowerCase().includes('song') || query.toLowerCase().includes('panoorin')) {
        contentOutput = `
            <div class="card">
                <h3 style="color: #38bdf8; font-size: 12px; margin-bottom: 8px;">📺 YouTube Media Result: "${query}"</h3>
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}" allowfullscreen></iframe>
                </div>
            </div>
        `;
    } else {
        // Para sa pangkalahatang kaalaman, balita, o web search gamit ang DuckDuckGo API sa server
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
            const apiRes = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await apiRes.json();

            const description = data.AbstractText || data.RelatedTopics?.[0]?.Text || `Matagumpay na sinaliksik at pinroseso ng Render server ang iyong kahilingan para sa: "${query}". Ligtas na nakatala sa server history.`;
            
            contentOutput = `
                <div class="card">
                    <h3 style="color: #38bdf8; font-size: 12px; margin-bottom: 6px;">🌐 Server Web Result</h3>
                    <p style="color: #e2e8f0; font-size: 11px; line-height: 1.5;">${description}</p>
                </div>
            `;
        } catch (err) {
            contentOutput = `
                <div class="card">
                    <h3 style="color: #38bdf8; font-size: 12px; margin-bottom: 6px;">⚠️ Server Handled</h3>
                    <p style="color: #e2e8f0; font-size: 11px;">Naitala ang iyong paghahanap na "${query}" sa server database nang walang aberya.</p>
                </div>
            `;
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Universal Server Result</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body { width: 100vw; height: 100vh; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .container { width: 100%; max-width: 380px; height: 100vh; max-height: 740px; background: #090d16; display: flex; flex-direction: column; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.95); }
                @media(min-width: 420px) { .container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
                .header h2 { font-size: 13px; color: #38bdf8; }
                .back-btn { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .ip-badge { background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); padding: 6px 10px; border-radius: 8px; margin-bottom: 10px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
                .ip-badge b { color: #34d399; font-family: monospace; }
                .results-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
                .card { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px; border-radius: 12px; }
                .video-container { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000; margin-top: 6px; }
                .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
                .search-again { margin-top: 10px; display: flex; gap: 8px; }
                .search-again input { flex: 1; height: 36px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; }
                .search-again button { background: #38bdf8; border: none; border-radius: 8px; color: #0f172a; font-weight: bold; padding: 0 12px; font-size: 11px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🌐 Universal Server Mode</h2>
                    <a href="/" class="back-btn">🏠 Home</a>
                </div>
                <div class="ip-badge">
                    <span>Server IP:</span>
                    <b>${serverIp}</b>
                </div>
                <div class="results-area">
                    ${contentOutput}
                </div>
                <div class="search-again">
                    <form action="/search" method="GET" style="display:flex; width:100%; gap:8px;">
                        <input type="text" name="q" placeholder="Maghanap ulit..." />
                        <button type="submit">I-search</button>
                    </form>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Server History Page
app.get('/history', (req, res) => {
    let historyHtml = searchHistory.length === 0 
        ? '<p style="color:#94a3b8; font-size:12px; text-align:center; margin-top:20px;">Wala pang history sa server.</p>'
        : searchHistory.map(item => `
            <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08); padding:8px 10px; border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="color:#38bdf8; font-size:11px; font-weight:bold;">${item.query}</span>
                    <div style="color:#64748b; font-size:9px;">${item.time}</div>
                </div>
                <span style="background:#0284c7; color:#fff; font-size:8px; padding:2px 6px; border-radius:4px;">Cloud</span>
            </div>
        `).reverse().join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Server History</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body { width: 100vw; height: 100vh; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .container { width: 100%; max-width: 380px; height: 100vh; max-height: 740px; background: #090d16; display: flex; flex-direction: column; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.95); }
                @media(min-width: 420px) { .container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
                .header h2 { font-size: 13px; color: #38bdf8; }
                .back-btn { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .list { flex: 1; overflow-y: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📦 Server History</h2>
                    <a href="/" class="back-btn">Bumalik</a>
                </div>
                <div class="list">
                    ${historyHtml}
                </div>
            </div>
        </body>
        </html>
    `);
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
            <title>Universal Cloud OS</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .status-bar { height: 30px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 10px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .screen-area { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); padding: 16px; overflow-y: auto; }
                .metrics-card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px 12px; border-radius: 12px; margin-bottom: 12px; font-size: 10px; color: #94a3b8; }
                .server-ip-text { color: #34d399; font-family: monospace; font-weight: bold; font-size: 11px; }
                .search-box-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
                .search-box-card h2 { font-size: 13px; color: #38bdf8; margin-bottom: 8px; }
                .search-box-card input { width: 100%; height: 36px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; margin-bottom: 8px; }
                .search-box-card button { width: 100%; height: 36px; background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size: 12px; cursor: pointer; }
                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 10px; text-align: left; color: #e2e8f0; font-size: 11px; cursor: pointer; text-decoration: none; display: flex; flex-direction: column; gap: 2px; }
                .link-btn span { font-size: 9px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="status-bar">
                    <span>12:00 PM</span>
                    <span>🌐 Universal Cloud OS</span>
                </div>
                <div class="screen-area">
                    <div class="metrics-card">
                        <div>Server IP: <span class="server-ip-text">${serverIp}</span></div>
                    </div>
                    <div class="search-box-card">
                        <h2>🔍 Server-Side Search</h2>
                        <form action="/search" method="GET">
                            <input type="text" name="q" placeholder="Maghanap ng kahit ano o video..." />
                            <button type="submit">I-search sa Server</button>
                        </form>
                    </div>
                    <div class="quick-links">
                        <a href="/search?q=Trending+Music" class="link-btn">
                            <strong>🎵 Media Search</strong>
                            <span>YouTube & Videos</span>
                        </a>
                        <a href="/search?q=NodeJS+Tutorial" class="link-btn">
                            <strong>📚 Web Search</strong>
                            <span>Kaalaman at Iba pa</span>
                        </a>
                        <a href="/history" class="link-btn" style="grid-column: span 2; background: rgba(2, 132, 199, 0.2); border-color: rgba(56, 189, 248, 0.4);">
                            <strong style="color: #38bdf8;">Tingnan ang Server History</strong>
                            <span>Lahat ng hinalungkat ng Cloud</span>
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Universal Cloud OS running on port ${PORT}`);
});
