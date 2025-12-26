import { config } from "./config/settings.js";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { authMiddleware } from "./backend/auth.js";
import User from "./backend/models/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Auth verification for Telegram Mini App
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.user.id.toString() });
        if (user && user.isAuth) {
            return res.json({ success: true, user });
        }
        res.status(403).json({ success: false, message: "User not registered in bot. Please use /start in the bot first." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(config.app.port, () => {
    console.log(`[ SERVER ] Dashboard running at ${config.app.urlWeb}:${config.app.port}`);
});
