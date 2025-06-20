// login.js

function jwt_decode(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Login gagal: Token tidak valid."; errorDiv.style.display = 'block'; }
        return null;
    }
}

function handleCredentialResponse(response) {
    const decodedToken = jwt_decode(response.credential);
    if (!decodedToken) return;
    const userProfile = {
        id: decodedToken.sub,
        name: decodedToken.name,
        givenName: decodedToken.given_name,
        familyName: decodedToken.family_name,
        picture: decodedToken.picture,
        email: decodedToken.email
    };
    localStorage.setItem('novaUser', JSON.stringify(userProfile));
    localStorage.setItem('isLoggedIn', 'true');

    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
    localStorage.removeItem('redirectAfterLogin');

    if (localStorage.getItem('loginTriggeredByCard')) {
        localStorage.removeItem('loginTriggeredByCard');
    }

    window.location.href = redirectUrl;
}

// DATA UNTUK FITUR UNGGULAN NOVARIA (DIMODIFIKASI UNTUK CODEX)
const featureCardsData = [
    // Kartu-kartu yang ingin Anda hapus sudah dihilangkan sesuai permintaan sebelumnya
    {
        icon: "psychology", // AI Profesional Ramah
        title: "AI Profesional Ramah",
        description: "Novaria dirancang untuk menjadi partner AI yang profesional namun tetap ramah dan mudah diajak berinteraksi.",
        image: "images/ai-profesional.png", // Pastikan gambar ini ada
        actionType: "default_redirect" // Mengarah ke index.html (chat utama)
    },
    {
        icon: "palette", // Generate Image
        title: "Generate Image",
        description: "Buat gambar unik dan kreatif dari deskripsi teks Anda dengan kekuatan AI.",
        image: "images/generate-image-feature.png", // Pastikan gambar ini ada
        actionType: "go_to_image_page" // Mengarah ke image.html
    },
    {
        icon: "code_blocks", // atau "terminal", "data_object"
        title: "Codex Generator", // DIUBAH NAMANYA
        description: "Rancang, tulis, dan debug kode dalam berbagai bahasa pemrograman dengan bantuan AI coder canggih.",
        image: "images/codex-generator-feature.png", // GANTI NAMA GAMBAR JIKA PERLU, pastikan ada
        actionType: "go_to_codex_page" // DIUBAH ACTION TYPE
    }
];

function renderFeatureCards() {
    const grid = document.getElementById('featuresGrid');
    if (!grid) { console.error("Element #featuresGrid tidak ditemukan untuk fitur Novaria."); return; }
    grid.innerHTML = '';
    featureCardsData.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'feature-card';
        const iconName = card.icon || "help_outline";
        cardElement.innerHTML = `
            <div class="card-header">
                <span class="material-symbols-outlined card-icon">${iconName}</span>
                <h3>${card.title}</h3>
            </div>
            <p class="card-description">${card.description}</p>
            <div class="card-image-container">
                <img src="${card.image}" alt="${card.title}" loading="lazy">
            </div>
            <button class="card-cta-button" data-feature-title="${card.title}" data-action-type="${card.actionType || 'default_redirect'}">Coba Sekarang</button>
        `;
        grid.appendChild(cardElement);
    });

    document.querySelectorAll('#featuresGrid .card-cta-button').forEach(button => {
        button.addEventListener('click', function() {
            const featureTitle = this.dataset.featureTitle;
            const actionType = this.dataset.actionType;

            localStorage.setItem('loginTriggeredByCard', featureTitle);

            if (localStorage.getItem('isLoggedIn') === 'true') {
                if (actionType === "go_to_image_page") {
                    window.location.href = 'image.html';
                } else if (actionType === "go_to_codex_page") { // DIUBAH
                    window.location.href = 'codex.html';    // DIUBAH
                } else { // default_redirect
                    window.location.href = 'index.html';
                }
            } else {
                if (actionType === "go_to_image_page") {
                    localStorage.setItem('redirectAfterLogin', 'image.html');
                } else if (actionType === "go_to_codex_page") { // DIUBAH
                    localStorage.setItem('redirectAfterLogin', 'codex.html'); // DIUBAH
                } else { // default_redirect
                    localStorage.setItem('redirectAfterLogin', 'index.html');
                }

                if (window.google && google.accounts && google.accounts.id) {
                    google.accounts.id.prompt(notification => {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            console.log('Google One Tap tidak ditampilkan.');
                            const headerLoginButton = document.querySelector('#googleSignInButtonContainer button, #googleSignInButtonContainer > div > div');
                            if (headerLoginButton) {
                                headerLoginButton.focus();
                                headerLoginButton.style.outline = '2px solid var(--accent-gradient-start)';
                                setTimeout(() => { headerLoginButton.style.outline = 'none'; }, 2500);
                            }
                        }
                    });
                } else {
                    console.error("Layanan Google Identity tidak tersedia untuk memicu prompt login.");
                }
            }
        });
    });
}

// DATA UNTUK KARTU JELAJAHI AI LAIN
const exploreAiData = [
    { name: "Monica.im", logo: "images/explore/monica.png", description: "Asisten AI serbaguna untuk browsing, menulis, dan berkreasi dengan dukungan GPT-4.", url: "https://monica.im/", gradient: ['#f0abfc', '#a855f7'] },
    { name: "Perplexity AI", logo: "images/explore/perplexity.png", description: "Mesin penjawab bertenaga AI yang menyediakan sumber dan kutipan akurat.", url: "https://www.perplexity.ai/", gradient: ['#38bdf8', '#0ea5e9'] },
    { name: "Hugging Face", logo: "images/explore/huggingface.png", description: "Komunitas dan platform untuk model machine learning open-source.", url: "https://huggingface.co/", gradient: ['#facc15', '#eab308'] },
    { name: "Claude AI", logo: "images/explore/claude.png", description: "Model bahasa besar dari Anthropic dengan fokus pada keamanan dan keandalan.", url: "https://claude.ai/", gradient: ['#f97316', '#ea580c'] },
    { name: "GitHub Copilot", logo: "images/explore/copilot.png", description: "Pair programmer AI yang membantu Anda menulis kode lebih cepat dan lebih baik.", url: "https://github.com/features/copilot", gradient: ['#6b7280', '#4b5563'] },
    { name: "RunwayML", logo: "images/explore/runwayml.png", description: "Suite alat kreatif bertenaga AI untuk generasi video, gambar, dan lainnya.", url: "https://runwayml.com/", gradient: ['#ec4899', '#db2777'] },
    { name: "Midjourney", logo: "images/explore/midjourney.png", description: "Laboratorium riset independen yang menghasilkan gambar dari deskripsi teks.", url: "https://www.midjourney.com/", gradient: ['#8b5cf6', '#7c3aed'] },
    { name: "Gemini", logo: "images/explore/gemini.png", description: "Model AI multimodal paling canggih dari Google DeepMind.", url: "https://deepmind.google/technologies/gemini/", gradient: ['#3b82f6', '#60a5fa'] }
];

function renderExploreAiCards() {
    const grid = document.getElementById('exploreAiGrid');
    if (!grid) { console.error("Element #exploreAiGrid tidak ditemukan."); return; }
    grid.innerHTML = '';
    exploreAiData.forEach(item => {
        const cardElement = document.createElement('a');
        cardElement.className = 'explore-card';
        cardElement.href = item.url;
        cardElement.target = "_blank";
        cardElement.rel = "noopener noreferrer";
        const gradientBorderStyle = `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`;
        const buttonGradientStyle = `linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]})`;
        cardElement.innerHTML = `
            <div class="gradient-border-shine" style="background: ${gradientBorderStyle};"></div>
            <div class="explore-card-content">
                <div class="explore-card-header">
                    <img src="${item.logo}" alt="${item.name} Logo" class="explore-card-logo" loading="lazy">
                    <h3>${item.name}</h3>
                </div>
                <div class="explore-card-divider"></div>
                <p class="explore-card-description">${item.description}</p>
                <span class="explore-card-button" style="background: ${buttonGradientStyle};">
                    Jelajahi ${item.name.split('.')[0]}
                </span>
            </div>
        `;
        grid.appendChild(cardElement);
    });
}

function applyLoginTheme(isLightMode) {
    if (isLightMode) {
        document.body.classList.add('light-mode');
        localStorage.setItem('novaria_theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('novaria_theme', 'dark');
    }
}

function setupLoginThemeToggle() {
    const themeToggleLogin = document.getElementById('themeToggleLogin');
    if (!themeToggleLogin) return;
    const savedTheme = localStorage.getItem('novaria_theme'); // Pastikan key tema konsisten
    if (savedTheme === 'light') {
        themeToggleLogin.checked = true;
        applyLoginTheme(true);
    } else {
        themeToggleLogin.checked = false;
        applyLoginTheme(false);
    }
    themeToggleLogin.addEventListener('change', () => {
        applyLoginTheme(themeToggleLogin.checked);
    });
}

window.onload = function () {
    const currentYearSpanLogin = document.getElementById('currentYearLogin');
    if (currentYearSpanLogin) { currentYearSpanLogin.textContent = new Date().getFullYear(); }

    if (document.getElementById('featuresGrid')) { renderFeatureCards(); }
    if (document.getElementById('exploreAiGrid')) { renderExploreAiCards(); }

    setupLoginThemeToggle();

    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    if (!clientIdMeta || !clientIdMeta.content || clientIdMeta.content === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" || clientIdMeta.content.length < 20) {
        console.error("Google Client ID tidak ditemukan, belum diganti, atau tidak valid.");
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Konfigurasi login tidak valid. Harap periksa Client ID."; errorDiv.style.display = 'block';}
        const signInBtnContainer = document.getElementById('googleSignInButtonContainer');
        if(signInBtnContainer) signInBtnContainer.innerHTML = "<p style='font-size:0.8rem; color: var(--secondary-text-color);'>Layanan login tidak tersedia sementara.</p>";
        return;
    }
    const clientId = clientIdMeta.content;

    try {
        if (window.google && google.accounts && google.accounts.id && typeof google.accounts.id.disableAutoSelect === 'function') {
            google.accounts.id.disableAutoSelect();
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
        });

        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if (signInButtonContainer) {
             if (localStorage.getItem('isLoggedIn') !== 'true') {
                google.accounts.id.renderButton(signInButtonContainer, {
                    theme: "filled_black",
                    size: "medium",
                    type: "standard",
                    shape: "pill",
                    text: "signin",
                    logo_alignment: "left"
                });
            } else {
                const user = JSON.parse(localStorage.getItem('novaUser'));
                const userName = user.givenName || user.name.split(' ')[0];
                signInButtonContainer.innerHTML = `<div class="user-greeting-header"><img src="${user.picture}" alt="${userName}" class="user-avatar-header"/><span>Hi, ${userName}!</span><a href="index.html" class="go-to-app-btn">Buka Aplikasi</a></div>`;
            }
        }
    } catch (error) {
        console.error("Google Identity Services init error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Gagal memuat layanan login Google."; errorDiv.style.display = 'block'; }
    }
};
