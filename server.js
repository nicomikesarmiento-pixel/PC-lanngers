const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Server-Side Memory Storage (Naka-save sa Cloud Server)
let searchHistory = [];

const quickKnowledge = {
    "nodejs": "Ang Node.js ay isang JavaScript runtime na bumubuo ng mabilis at scalable na network applications.",
    "server": "Ang server ay isang computer o sistema na nagbibigay ng data o serbisyo sa iba pang mga devices sa network.",
    "html": "Ang HTML ang standard markup language para sa paggawa ng mga webpages.",
    "python": "Ang Python ay isang high-level programming language na kilala sa pagiging madali at malakas.",
    "browser": "Ang browser ay application para magbukas at mag-navigate sa internet."
};

async function getServerIp() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return 'Render.com Cloud IP';
    }
}

// Server Search Route na may IP Proof
app.get('/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) return res.redirect('/');

    const lowerQuery = query.toLowerCase();
    const serverIp = await getServerIp();

    // 1. I-save sa Server History
    searchHistory.push({
        query: query,
        ip: serverIp,
        time: new Date().toLocaleTimeString()
    });
    if (searchHistory.length > 50) searchHistory.shift();

    // 2. Mabilis na Server Processing
    let responseText = quickKnowledge[lowerQuery];
    
    if (!responseText) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
            const apiRes = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await apiRes.json();
            responseText = data.AbstractText || data.RelatedTopics?.[0]?.Text || `Matagumpay na pinroseso ng server ang iyong hinanap na: "${query}".`;
        } catch (err) {
            responseText = `Naitala at pinroseso sa server ang iyong hinanap: "${query}".`;
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cloud Server Result</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body { width: 100vw; height: 100vh; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .container { width: 100%; max-width: 380px; height: 100vh; max-height: 740px; background: #090d16; display: flex; flex-direction: column; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.95); }
                @media(min-width: 420px) { .container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
                .header h2 { font-size: 13px; color: #38bdf8; }
                .back-btn { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .ip-proof { background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); padding: 8px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center; }
                .ip-proof b { color: #34d399; font-family: monospace; }
                .results-area { flex: 1; overflow-y: auto; }
                .card { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.3); padding: 14px; border-radius: 12px; margin-bottom: 15px; }
                .card h3 { color: #38bdf8; font-size: 12px; margin-bottom: 6px; }
                .card p { color: #e2e8f0; font-size: 11px; line-height: 1.4; }
                .search-again { margin-top: 10px; display: flex; gap: 8px; }
                .search-again input { flex: 1; height: 38px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; }
                .search-again button { background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; padding: 0 14px; font-size: 11px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>⚡ Server Processed</h2>
                    <a href="/" class="back-btn">🏠 Home</a>
                </div>
                <div class="ip-proof">
                    <span>Server IP (Gumagana):</span>
                    <b>${serverIp}</b>
                </div>
                <div class="results-area">
                    <div class="card">
                        <h3>📌 Resulta para sa: "${query}"</h3>
                        <p>${responseText}</p>
                    </div>
                </div>
                <div class="search-again">
                    <form action="/search" method="GET" style="display:flex; width:100%; gap:8px;">
                        <input type="text" name="q" placeholder="Maghanap ulit..." />
                        <button type="submit">Hanapin</button>
                    </form>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Server History Page na may IP logs
app.get('/history', async (req, res) => {
    const serverIp = await getServerIp();
    let historyHtml = searchHistory.length === 0 
        ? '<p style="color:#94a3b8; font-size:12px; text-align:center; margin-top:20px;">Wala pang history sa server.</p>'
        : searchHistory.map(item => `
            <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="color:#38bdf8; font-size:11px; font-weight:bold;">${item.query}</span>
                    <div style="color:#64748b; font-size:9px; margin-top:2px;">Oras: ${item.time} | IP: ${item.ip}</div>
                </div>
                <span style="background:#0284c7; color:#fff; font-size:8px; padding:2px 6px; border-radius:4px;">Server Cloud</span>
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
                .container { width: 100%; max-width: 380px; height: 100vh; max-height: 740px; background: #090d16; display: flex; flex-direction: column; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.95); }
                @media(min-width: 420px) { .container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
                .header h2 { font-size: 13px; color: #38bdf8; }
                .back-btn { color: #f43f5e; text-decoration: none; font-size: 11px; font-weight: bold; }
                .list { flex: 1; overflow-y: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📦 Server History & IP Logs</h2>
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

// Home Dashboard na may malinaw na Server IP
app.get('/', async (req, res) => {
    const serverIp = await getServerIp();
    res.send(`
        <!DOCTYPE html>
        <html lang="tl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Cloud Server OS</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
                body, html { width: 100%; height: 100%; background-color: #030712; font-family: sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .phone-container { width: 100vw; height: 100vh; max-width: 380px; max-height: 740px; background: #090d16; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95); overflow: hidden; }
                @media(min-width: 420px) { .phone-container { border-radius: 36px; border: 8px solid #111827; height: 92vh; } }
                .status-bar { height: 32px; background: rgba(9, 13, 22, 0.95); display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 10px; font-weight: 600; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .screen-area { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); padding: 20px; overflow-y: auto; }
                .metrics-card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px 14px; border-radius: 12px; margin-bottom: 14px; font-size: 10px; color: #94a3b8; }
                .metrics-card b { color: #38bdf8; }
                .server-ip-text { color: #34d399; font-family: monospace; font-weight: bold; font-size: 11px; }
                .search-box-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; margin-bottom: 15px; }
                .search-box-card h2 { font-size: 13px; color: #38bdf8; margin-bottom: 10px; }
                .search-box-card input { width: 100%; height: 38px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; padding: 0 10px; font-size: 12px; outline: none; margin-bottom: 10px; }
                .search-box-card button { width: 100%; height: 38px; background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; border-radius: 8px; color: #0f172a; font-weight: bold; font-size: 12px; cursor: pointer; }
                .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .link-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; text-align: left; color: #e2e8f0; font-size: 11px; cursor: pointer; text-decoration: none; display: flex; flex-direction: column; gap: 4px; }
                .link-btn span { font-size: 9px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="phone-container">
                <div class="status-bar">
                    <span>12:00 PM</span>
                    <span>☁️ Cloud Server Active</span>
                </div>
                <div class="screen-area">
                    <div class="metrics-card">
                        <div>Server Engine: <b>Aktibo at Mabilis</b></div>
                        <div style="margin-top: 4px;">Server IP Address: <br><span class="server-ip-text">${serverIp}</span></div>
                    </div>
                    <div class="search-box-card">
                        <h2>🔍 Server-Side Search</h2>
                        <form action="/search" method="GET">
                            <input type="text" name="q" placeholder="Mag-search o magtanong dito..." />
                            <button type="submit">I-process sa Server</button>
                        </form>
                    </div>
                    <div class="quick-links">
                        <a href="/search?q=NodeJS" class="link-btn">
                            <strong>Node.js</strong>
                            <span>Subukan ang Server</span>
                        </a>
                        <a href="/history" class="link-btn" style="background: rgba(2, 132, 199, 0.2); border-color: rgba(56, 189, 248, 0.4);">
                            <strong style="color: #38bdf8;">Tingnan ang History</strong>
                            <span>Naka-save sa Server</span>
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Cloud Server running on port ${PORT}`);
});
                            
