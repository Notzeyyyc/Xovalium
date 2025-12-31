document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check User & Admin Status
        const res = await fetch('/api/user/me');
        const data = await res.json();
        
        if (data.success) {
            const user = data.user;
            
            // Check for Admin Link in bottom nav or user profile
            const nav = document.querySelector('nav');
            if (user.role === 'owner' && nav) {
                const adminIcon = document.createElement('a');
                adminIcon.href = '/admin/index.html';
                adminIcon.innerHTML = `<span class="material-symbols-outlined text-indigo-400 hover:text-indigo-300 transition-colors">admin_panel_settings</span>`;
                nav.appendChild(adminIcon);
            }
        }

        // Check Global Notification
        const appRes = await fetch('/api/app/info');
        const appData = await appRes.json();
        
        if (appData.success && appData.notification && appData.notification.message) {
            const notif = appData.notification;
            const lastShown = localStorage.getItem('last_notif_time');
            const notifTime = new Date(notif.updatedAt).getTime();
            
            if (notifTime > (parseInt(lastShown) || 0)) {
                if (window.toast) {
                    window.toast[notif.type](notif.message, 5000);
                    localStorage.setItem('last_notif_time', notifTime.toString());
                }
            }
        }
    } catch (e) {
        console.error("Common JS Error:", e);
    }
});
