import crypto from 'crypto';
import { config } from '../config/settings.js';

/**
 * Validates data received from Telegram Web App
 * @param {string} initData - The raw initData string from Telegram.WebApp.initData
 */
export const validateTelegramAuth = (initData) => {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        const dataCheckString = Array.from(urlParams.entries())
            .map(([key, value]) => `${key}=${value}`)
            .sort()
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData')
            .update(config.telegram.token)
            .digest();

        const calculatedHash = crypto.createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return calculatedHash === hash;
    } catch (error) {
        return false;
    }
};

/**
 * Express middleware to protect routes
 */
export const authMiddleware = (req, res, next) => {
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) {
        return res.status(401).json({ error: 'Unauthorized: No init data provided' });
    }

    if (validateTelegramAuth(initData)) {
        // Parse user data from initData
        const urlParams = new URLSearchParams(initData);
        const userData = JSON.parse(urlParams.get('user'));
        req.user = userData;
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid init data' });
    }
};
