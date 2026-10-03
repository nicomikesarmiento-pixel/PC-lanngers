const express = require('express');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para sa bilis at seguridad ng data
app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Root endpoint para makita mong active ang server
app.get('/', (req, res) => {
    res.json({
        status: "online",
        message: "GitHub + Render Custom API Engine is running smoothly!",
        timestamp: new Date().toISOString()
    });
});

// 🛠️ Custom Modified API Engine para sa Sketchware Clone Apps
app.all('/api/custom-engine', async (req, res) => {
    const action = req.query.action || req.body.action;

    // Test Action: Pagbibigay ng sariling gawang modified data kapag walang URL na ibinigay
    if (action === 'get_data' || (!req.query.url && !req.body.url)) {
        return res.json({
            status: "success",
            engine: "GitHub + Render Custom Engine",
            message: "Tagumpay! Ang server na naka-sync mula sa GitHub ang nagpapatakbo ng signal.",
            modifiedPayload: {
                title: "Server-Side Modified Data",
                activeSignal: "100% Server Side (No VPN, No Phone Load)",
                serverNode: "Render Cloud Active",
                timestamp: new Date().toISOString()
            }
        });
    }

    // External API Modification Action
    let targetApiUrl = req.query.url || req.body.url;

    try {
        const apiResponse = await fetch(targetApiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Android; Mobile; CustomEngine/2.0)',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        let data;
        const contentType = apiResponse.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            data = await apiResponse.json();
            
            // 🔥 Dito binabago o pinapalitan ng server engine ang API response para hindi ma-block
            data.serverModifiedByGitHubEngine = "Ang data na ito ay dumaan at binago ng GitHub-synced Render server.";
            
        } else {
            data = { rawText: await apiResponse.text() };
        }

        res.json({
            success: true,
            source: "Modified GitHub-Render Engine",
            originalApi: targetApiUrl,
            payload: data
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Nabigo ang Custom Engine na i-modify ang API o kunin ang target."
        });
    }
});

app.listen(PORT, () => {
    console.log(`GitHub-Render Custom API Engine running on port ${PORT}`);
});
