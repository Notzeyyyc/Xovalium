/**
 * Telegram Mini App Authentication Helper
 */
const TelegramAuth = {
    init: async () => {
        const tg = window.Telegram?.WebApp;
        if (!tg) {
            console.error('Telegram WebApp is not available.');
            // Uncomment to redirect if not in TG
            // window.location.href = 'https://t.me/your_bot_username';
            return;
        }

        tg.expand(); // Full screen

        const initData = tg.initData;
        if (!initData) {
            document.body.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Please open this app through the Telegram bot.</div>';
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'x-telegram-init-data': initData
                }
            });

            const result = await response.json();

            if (!result.success) {
                document.body.innerHTML = `<div style="color: white; text-align: center; padding: 20px; font-family: sans-serif;">
                    <h2>Access Denied</h2>
                    <p>${result.message || 'Unauthorized access.'}</p>
                    <button onclick="window.Telegram.WebApp.close()" style="padding: 10px 20px; border-radius: 8px; border: none; background: #0088cc; color: white;">Close App</button>
                </div>`;
                return;
            }

            console.log('✅ Authenticated as:', result.user.username);
            return result.user;
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
};

// Auto-run if not on index (or you can manually call it)
document.addEventListener('DOMContentLoaded', () => {
    TelegramAuth.init();
});
