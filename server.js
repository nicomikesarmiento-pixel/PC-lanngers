const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const publicInstances = [
    'https://invidious.privacyredirect.com',
    'https://vid.priv.au',
    'https://yt.artemislabs.org',
    'https://pipedapi.kavin.rocks'
];

function getRandomInstance() {
    return publicInstances[Math.floor(Math.random() * publicInstances.length)];
}

// 🔌 Socket.io Real-time Connection (Fake/Real IO Engine)
io.on('connection', (socket) => {
    console.log(`Isang kliyente ang kumonekta via Socket.io: ${socket.id}`);

    // Makikinig ang server sa search request galing sa Sketchware app nang real-time
    socket.on('search_youtube', async (searchQuery) => {
        if (!searchQuery) {
            socket.emit('youtube_results', { success: false, error: "Walang search query na ibinigay." });
            return;
        }

        let successData = null;

        for (let i = 0; i < publicInstances.length; i++) {
            const instance = getRandomInstance();
            const targetUrl = `${instance}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`;

            try {
                const response = await fetch(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        successData = data;
                        break;
                    } else if (data.items && Array.isArray(data.items)) {
                        successData = data.items;
                        break;
                    }
                }
            } catch (err) {
                // Try next node
            }
        }

        if (!successData) {
            socket.emit('youtube_results', { success: false, error: "Nabigo ang mga nodes na sagutin ang hiling." });
            return;
        }

        const optimizedVideos = successData.map(item => ({
            title: item.title || "No Title",
            videoId: item.videoId || item.id || "",
            thumbnail: `https://i.ytimg.com/vi/${item.videoId || item.id}/hqdefault.jpg`,
            duration: item.lengthSeconds ? `${Math.floor(item.lengthSeconds / 60)}m` : "N/A",
            channel: item.author || "Unknown Channel"
        }));

        // Agad na ibabato pabalik sa Sketchware app via Socket.io ang resulta nang instant
        socket.emit('youtube_results', {
            success: true,
            engineVersion: "2026.1-SocketIO",
            query: searchQuery,
            videos: optimizedVideos
        });
    });

    socket.on('disconnect', () => {
        console.log(`Kumalas ang kliyente: ${socket.id}`);
    });
});

// Original HTTP Endpoint pa rin para sa backup
app.get('/api/youtube-2026', async (req, res) => {
    // (Maaari ding lagyan ng kaparehong logic kung kailangan ng HTTP fallback)
    res.json({ status: "online", message: "Gamitin ang Socket.io para sa real-time stream." });
});

server.listen(PORT, () => {
    console.log(`2026 Next-Gen Socket.io Engine running on port ${PORT}`);
});
        
