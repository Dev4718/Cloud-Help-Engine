(() => {
    const themeKey = 'cloudHelpEngine.theme';
    const root = document.documentElement;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
    let themeToggle;

    function renderToggle() {
        if (!themeToggle) return;

        const isDark = root.dataset.theme === 'dark';
        const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        const icon = isDark
            ? '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.1-7.1-1.4 1.4M6.3 17.7l-1.4 1.4m14.2 0-1.4-1.4M6.3 6.3 4.9 4.9"/>'
            : '<path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/>';

        themeToggle.setAttribute('aria-label', label);
        themeToggle.setAttribute('title', label);
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg>`;

        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) themeMeta.setAttribute('content', isDark ? '#101a25' : '#f3f7fb');
    }

    function applyTheme(theme, source) {
        root.dataset.theme = theme;
        root.dataset.themeSource = source;
        renderToggle();
    }

    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem(themeKey);
    } catch (error) {
        savedTheme = null;
    }

    if (savedTheme === 'light' || savedTheme === 'dark') {
        applyTheme(savedTheme, 'saved');
    } else {
        applyTheme(systemPreference.matches ? 'dark' : 'light', 'system');
    }

    function mountToggle() {
        const navigation = document.querySelector('.horizontal-nav');
        if (!navigation) return;

        themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) {
            themeToggle = document.createElement('button');
            themeToggle.id = 'theme-toggle';
            themeToggle.className = 'theme-toggle';
            themeToggle.type = 'button';

            const insertionPoint = navigation.querySelector('.login-register') || navigation.querySelector('.profile');
            navigation.insertBefore(themeToggle, insertionPoint || null);
        }

        themeToggle.addEventListener('click', () => {
            const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme, 'saved');
            try {
                localStorage.setItem(themeKey, nextTheme);
            } catch (error) {
                // The selected theme remains active for this page session.
            }
        });

        renderToggle();
    }

    function mountSidebar() {
        const sidebar = document.querySelector('.vertical-nav');
        if (!sidebar) return;

        if (!sidebar.id) sidebar.id = 'site-sidebar';
        const currentPage = location.pathname.split('/').pop() || 'index.html';
        const pageLabels = {
            'index.html': 'Home',
            'guide.html': 'Guides',
            'jobs.html': 'Jobs',
            'chatbot.html': 'Chatbot',
            'msg.html': 'Messages'
        };

        sidebar.querySelectorAll('a').forEach((link) => {
            const url = new URL(link.href, location.href);
            const page = url.pathname.split('/').pop();
            const label = url.origin !== location.origin ? 'Ask the assistant' : (pageLabels[page] || link.dataset.title || 'Open page');
            const isCurrent = page === currentPage || (currentPage === 'chatbot.html' && url.origin !== location.origin);

            link.dataset.title = label;
            link.setAttribute('aria-label', label);
            link.title = label;
            if (isCurrent) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');

            const image = link.querySelector('img');
            if (!image) return;

            if (page === 'index.html') {
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.setAttribute('class', 'sidebar-home-icon');
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.setAttribute('aria-hidden', 'true');
                icon.setAttribute('focusable', 'false');
                icon.innerHTML = '<path d="m3 10.8 9-7.5 9 7.5"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"/>';
                image.replaceWith(icon);
            } else {
                image.alt = '';
                image.setAttribute('aria-hidden', 'true');
            }

            if (!link.querySelector('.sidebar-link-label')) {
                const text = document.createElement('span');
                text.className = 'sidebar-link-label';
                text.textContent = label;
                link.appendChild(text);
            }
        });

        if (sidebar.querySelector('.sidebar-toggle')) return;

        const toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-controls', sidebar.id);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Expand navigation');
        toggle.title = 'Expand navigation';
        toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg>';
        toggle.addEventListener('click', () => {
            const expanded = sidebar.classList.toggle('is-expanded');
            document.body.classList.toggle('sidebar-expanded', expanded);
            toggle.setAttribute('aria-expanded', String(expanded));
            toggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} navigation`);
            toggle.title = `${expanded ? 'Collapse' : 'Expand'} navigation`;
        });

        sidebar.prepend(toggle);
    }

    function mountPageControls() {
        mountToggle();
        mountSidebar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountPageControls, { once: true });
    } else {
        mountPageControls();
    }

    systemPreference.addEventListener('change', (event) => {
        if (root.dataset.themeSource === 'system') {
            applyTheme(event.matches ? 'dark' : 'light', 'system');
        }
    });
})();
