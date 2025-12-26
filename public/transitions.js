document.addEventListener('DOMContentLoaded', () => {
    // Apply initial state
    document.body.classList.add('page-transition');
    
    // Trigger fade in
    setTimeout(() => {
        document.body.classList.add('fade-in');
    }, 10);

    // Intercept link clicks
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Basic check to see if it's a page navigation
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                // If it's an external link, we might not want to animate, 
                // but for now let's assume all links in this project are transitionable
                
                // Check if target is same window
                const target = link.getAttribute('target');
                if (target && target !== '_self') return;

                e.preventDefault();
                
                // Trigger fade out
                document.body.classList.remove('fade-in');
                document.body.classList.add('fade-out');

                // Navigate after animation
                setTimeout(() => {
                    window.location.href = href;
                }, 500); // Should match CSS transition duration
            }
        });
    });

    // Reset transition state when coming back from history (bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            document.body.classList.remove('fade-out');
            document.body.classList.add('fade-in');
        }
    });
});
