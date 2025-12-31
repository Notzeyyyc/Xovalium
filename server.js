import { config } from "./config/settings.js";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import User from "./backend/models/user.js";

import os from "os";
import { executeAttack, promoteToContacts } from "./plugins/function.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalNotification = {
    message: "Welcome to Xovalium Dashboard!",
    type: "info",
    updatedAt: new Date()
};

let botState = {
    state: 'disconnected',
    pairingCode: null,
    sessionId: 'server_main'
};

export const startServer = (bot) => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Middleware to check authentication
    const authMiddleware = (req, res, next) => {
        const token = req.cookies.auth_token;
        if (!token) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.redirect('/login.html');
        }
        try {
            const decoded = jwt.verify(token, config.app.secretKey);
            req.user = decoded;
            next();
        } catch (err) {
            res.clearCookie('auth_token');
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ error: 'Session expired' });
            }
            return res.redirect('/login.html');
        }
    };

    // Middleware to check admin role
    const adminMiddleware = (req, res, next) => {
        if (req.user && req.user.role === 'owner') {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
    };

    // Public API Routes
    app.post('/api/auth/request-otp', async (req, res) => {
        const { telegramId } = req.body;
        if (!telegramId) return res.status(400).json({ error: "Telegram ID is required" });

        try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

            await User.findOneAndUpdate(
                { telegramId },
                { otp, otpExpiry },
                { upsert: true }
            );

            await bot.sendMessage(telegramId, `🔐 **Your Login OTP:** \`${otp}\`\nThis code will expire in 5 minutes.`, { parse_mode: "Markdown" });

            res.json({ success: true, message: "OTP sent" });
        } catch (err) {
            res.status(500).json({ error: "Failed to send OTP. Make sure you have started the bot." });
        }
    });

    app.post('/api/auth/verify-otp', async (req, res) => {
        const { telegramId, otp } = req.body;
        try {
            const user = await User.findOne({ telegramId, otp });
            if (!user || user.otpExpiry < new Date()) {
                return res.status(401).json({ error: "Invalid or expired OTP" });
            }

            user.otp = undefined;
            user.otpExpiry = undefined;
            user.isVerified = true;
            user.lastLogin = new Date();
            
            // Assign Owner Role if matches config
            if (user.telegramId === config.app.ownerId) {
                user.role = 'owner';
                user.membership = 'lifetime';
            }
            
            await user.save();

            const token = jwt.sign({ id: user._id, telegramId: user.telegramId, role: user.role }, config.app.secretKey, { expiresIn: '24h' });
            res.cookie('auth_token', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get Current User Info
    app.get('/api/user/me', authMiddleware, async (req, res) => {
        try {
            const user = await User.findOne({ telegramId: req.user.telegramId });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get App Info (Notifications, etc)
    app.get('/api/app/info', authMiddleware, (req, res) => {
        res.json({ success: true, notification: globalNotification });
    });

    // --- ADMIN ROUTES ---
    app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
        const stats = {
            platform: os.platform(),
            uptime: os.uptime(),
            totalMem: os.totalmem(),
            freeMem: os.freemem(),
            cpuModel: os.cpus()[0].model,
            cpuCores: os.cpus().length,
            loadAvg: os.loadavg()
        };
        res.json({ success: true, stats });
    });

    app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const users = await User.find().sort({ createdAt: -1 });
            res.json({ success: true, users });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/admin/update-membership', authMiddleware, adminMiddleware, async (req, res) => {
        const { telegramId, membership } = req.body;
        try {
            const user = await User.findOneAndUpdate({ telegramId }, { membership }, { new: true });
            if (!user) return res.status(404).json({ error: "User not found" });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/admin/set-notification', authMiddleware, adminMiddleware, (req, res) => {
        const { message, type } = req.body;
        globalNotification = {
            message,
            type: type || 'info',
            updatedAt: new Date()
        };
        res.json({ success: true, notification: globalNotification });
    });

    // --- BLAST & ATTACK ROUTES ---
    app.post('/api/blast/attack', authMiddleware, async (req, res) => {
        const { jid, type } = req.body;
        
        try {
            // Find user to check membership
            const user = await User.findOne({ telegramId: req.user.telegramId });
            if (!user) return res.status(404).json({ error: "Identity not recognized" });

            // Access Control
            const isPrivileged = user.role === 'owner' || user.role === 'developer' || user.membership !== 'free';
            if (!isPrivileged) {
                return res.status(403).json({ error: "Access Denied: Highly privileged operation" });
            }

            if (!jid) return res.status(400).json({ error: "Target identifier required" });

            // bot is passed to startServer in xovalium.js
            const result = await executeAttack(bot, jid, type);
            if (result.success) {
                res.json({ success: true, target: jid });
            } else {
                res.status(500).json({ success: false, error: result.error });
            }
        } catch (err) {
            res.status(500).json({ error: "Kernel level transmission failure" });
        }
    });

    app.post('/api/blast/promote', authMiddleware, async (req, res) => {
        const { contacts, text, senderType } = req.body;
        
        try {
            const user = await User.findOne({ telegramId: req.user.telegramId });
            if (!user) return res.status(404).json({ error: "Identity not recognized" });

            // "System Server" line restricted to VIP/Owner
            if (senderType === 'server') {
                const isVIP = user.role === 'owner' || user.role === 'developer' || user.membership === 'vip' || user.membership === 'lifetime';
                if (!isVIP) {
                    return res.status(403).json({ error: "System Server line requires VIP/Lifetime access" });
                }
            } else {
                // Free plan limit
                if (contacts.length > 1000) {
                    return res.status(403).json({ error: "Standard Plan limit exceeded (Max 1,000 chats). Upgrade to VIP for unlimited access." });
                }
            }

            if (!contacts || !contacts.length) return res.status(400).json({ error: "Contact list required" });

            // In this implementation, we use the server's 'bot' for simplicity
            // In a multi-session system, 'personal' would use a different socket
            const targetSocket = bot; 

            // Execute promotion (not awaited to prevent timeout on large lists, but we'll return a count for now)
            promoteToContacts(targetSocket, contacts, text);

            res.json({ success: true, count: contacts.length });
        } catch (err) {
            res.status(500).json({ error: "Blast initiation failure" });
        }
    });

    // --- BOT MANAGEMENT ---
    app.get('/api/admin/bot-state', authMiddleware, adminMiddleware, (req, res) => {
        res.json({ success: true, ...botState });
    });

    app.post('/api/admin/bot-connect', authMiddleware, adminMiddleware, async (req, res) => {
        const { phoneNumber } = req.body;
        if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });

        const { connectToWhatsApp } = await import("./plugins/baileys.js");
        try {
            botState.state = 'connecting';
            botState.pairingCode = "Pending...";
            
            connectToWhatsApp(botState.sessionId, phoneNumber, (code) => {
                botState.pairingCode = code;
            }).then(() => {
                botState.state = 'connected';
                botState.pairingCode = null;
            }).catch(e => {
                botState.state = 'error';
                botState.pairingCode = null;
            });

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/admin/bot-logout', authMiddleware, adminMiddleware, (req, res) => {
        // Implementation for logout
        botState.state = 'disconnected';
        botState.pairingCode = null;
        res.json({ success: true });
    });

    // Public Static Pages
    app.get('/login.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    });

    // Logout
    app.get('/logout', (req, res) => {
        res.clearCookie('auth_token');
        res.redirect('/login.html');
    });

    // Protected Routes
    app.use((req, res, next) => {
        const publicFiles = ['/login.html', '/api/auth/request-otp', '/api/auth/verify-otp', '/fonts.css', '/transitions.css', '/js/', '/css/'];
        const isPublic = publicFiles.some(p => req.path === p || req.path.startsWith('/api/auth/') || req.path.endsWith('.css') || req.path.includes('/js/'));
        
        if (isPublic) return next();
        authMiddleware(req, res, next);
    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.use(express.static(path.join(__dirname, 'public')));

    app.listen(config.app.port, () => {
        console.log(`[ SERVER ] Dashboard running at ${config.app.urlWeb}:${config.app.port}`);
    });
};
