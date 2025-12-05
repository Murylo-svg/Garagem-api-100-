
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const token = localStorage.getItem('userToken');

    // SVG Icons
    const garageIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M19 10.5V20H5v-9.5a2.5 2.5 0 0 1 5 0V12h4v-1.5a2.5 2.5 0 0 1 5 0Z"/><path d="m2 10 1.4-1.4a2 2 0 0 1 2.8 0L8 10.2"/><path d="m22 10-1.4-1.4a2 2 0 0 0-2.8 0L16 10.2"/></svg>`;
    const userIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const loginIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
    const logoutIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
    const registerIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>`;

    let headerHTML = `
        <header class="main-header">
            <a href="/" class="logo">Garagem Aranha</a>
            <nav class="main-nav">
                <ul>
    `;

    if (token) {
        // Logged-in user
        headerHTML += `
            <li><a href="/garagem-publica.html">${garageIcon} Garagem Pública</a></li>
            <li><a href="/perfil.html">${userIcon} Perfil</a></li>
            <li><a href="#" id="logout-btn">${logoutIcon} Sair</a></li>
        `;
    } else {
        // Logged-out user
        headerHTML += `
            <li><a href="/garagem-publica.html">${garageIcon} Garagem Pública</a></li>
            <li><a href="/login/login.html">${loginIcon} Login</a></li>
            <li><a href="/login/cadastro.html">${registerIcon} Cadastro</a></li>
        `;
    }

    headerHTML += `
                </ul>
            </nav>
        </header>
    `;

    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHTML;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userToken');
            localStorage.removeItem('userName');
            showToast('Você foi desconectado.', 'info');
            setTimeout(() => {
                window.location.href = '/login/login.html';
            }, 1500);
        });
    }
});
