class Toast {
    constructor() {
        this.container = document.querySelector('.toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
        `;

        this.container.appendChild(toast);

        // Force reflow
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, duration);
    }

    success(m, d) { this.show(m, 'success', d); }
    error(m, d) { this.show(m, 'error', d); }
    warning(m, d) { this.show(m, 'warning', d); }
    info(m, d) { this.show(m, 'info', d); }
}

const toast = new Toast();
window.toast = toast; // Export to global scope
