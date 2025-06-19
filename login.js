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
    const userProfile = { id: decodedToken.sub, name: decodedToken.name, givenName: decodedToken.given_name, familyName: decodedToken.family_name, picture: decodedToken.picture, email: decodedToken.email };
    localStorage.setItem('novaUser', JSON.stringify(userProfile));
    localStorage.setItem('isLoggedIn', 'true');
    if (localStorage.getItem('loginTriggeredByCard')) { localStorage.removeItem('loginTriggeredByCard'); }
    window.location.href = 'index.html';
}

// DATA UNTUK FITUR UNGGULAN NOVARIA
const featureCardsData = [
    { icon: "edit_document", title: "Makalah & Esai", description: "Nova bisa membantumu menulis makalah ilmiah, artikel, opini, laporan, dan tugas sekolah dengan struktur yang jelas dan bahasa yang baik.", image: "images/makalah-esai.png" },
    { icon: "trending_up", title: "Marketing Finance", description: "Analisis tren pasar, buat strategi marketing, dan kelola keuangan dengan bantuan insight dari Novaria.", image: "images/marketing-finance.png" },
    { icon: "school", title: "Membantu Tugas", description: "Dapatkan bantuan untuk mengerjakan PR, riset materi pelajaran, dan persiapan ujian dengan Novaria.", image: "images/bantu-tugas.png" },
    { icon: "psychology", title: "AI Profesional Ramah", description: "Novaria dirancang untuk menjadi partner AI yang profesional namun tetap ramah dan mudah diajak berinteraksi.", image: "images/ai-profesional.png" },
    { icon: "summarize", title: "Analisis Dokumen", description: "Unggah dokumen Anda dan biarkan Novaria membantu menganalisis, merangkum, atau mengekstrak informasi penting.", image: "images/analisis-dokumen.png" }
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
            <button class="card-cta-button" data-feature-title="${card.title}">Coba Sekarang</button>
        `;
        grid.appendChild(cardElement);
    });

    document.querySelectorAll('#featuresGrid .card-cta-button').forEach(button => {
        button.addEventListener('click', function() {
            const featureTitle = this.dataset.featureTitle;
            localStorage.setItem('loginTriggeredByCard', `Novaria Feature: ${featureTitle}`);
            if (localStorage.getItem('isLoggedIn') === 'true') {
                window.location.href = 'index.html';
            } else {
                if (window.google && google.accounts && google.accounts.id) {
                    google.accounts.id.prompt(notification => {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            console.log('Google One Tap tidak ditampilkan untuk fitur Novaria. Tombol login header tersedia.');
                            const headerLoginButton = document.querySelector('#googleSignInButtonContainer button, #googleSignInButtonContainer > div > div');
                            if (headerLoginButton) { headerLoginButton.focus(); }
                        }
                    });
                }
            }
        });
    });
}

// DATA UNTUK KARTU JELAJAHI AI LAIN
const exploreAiData = [
    { name: "Monica.im", logo: "images/explore/monica.png", description: "Asisten AI serbaguna untuk browsing, menulis, dan berkreasi dengan dukungan GPT-4.", url: "https://monica.im/", gradient: ['#f0abfc', '#a855f7'] },
    { name: "Meta AI", logo: "images/explore/meta.png", description: "Model bahasa besar dari Meta, terintegrasi di berbagai platformnya.", url: "https://ai.meta.com/", gradient: ['#2563eb', '#3b82f6'] },
    { name: "ChatGPT", logo: "images/explore/chatgpt.png", description: "Model AI percakapan revolusioner dari OpenAI, pionir dalam interaksi bahasa alami.", url: "https://chat.openai.com/", gradient: ['#10b981', '#6ee7b7'] },
    { name: "DeepSeek", logo: "images/explore/deepseek.png", description: "Platform AI yang fokus pada pencarian cerdas dan pemahaman kode.", url: "https://www.deepseek.com/", gradient: ['#f59e0b', '#fcd34d'] },
    { name: "Qwen", logo: "images/explore/qwen.png", description: "Seri model bahasa besar dari Alibaba Cloud, mendukung multimodalitas.", url: "https://qwenlm.aliyun.com/", gradient: ['#ef4444', '#f87171'] },
    { name: "DeepAI", logo: "images/explore/deepai.png", description: "Menyediakan berbagai alat dan API AI untuk generasi gambar, teks, dan lainnya.", url: "https://deepai.org/", gradient: ['#6366f1', '#818cf8'] },
    { name: "Cohere", logo: "images/explore/cohere.png", description: "Platform AI untuk developer membangun aplikasi dengan LLM canggih.", url: "https://cohere.com/", gradient: ['#d946ef', '#e879f9'] },
    { name: "AI Studio", logo: "images/explore/aistudio.png", description: "Google AI Studio untuk eksplorasi dan prototipe dengan model Gemini.", url: "https://aistudio.google.com/", gradient: ['#0ea5e9', '#38bdf8'] },
    { name: "Microsoft AI", logo: "images/explore/microsoft.png", description: "Solusi dan platform AI komprehensif dari Microsoft Azure dan Bing.", url: "https://www.microsoft.com/ai", gradient: ['#14b8a6', '#5eead4'] },
    { name: "Gemma", logo: "images/explore/gemma.png", description: "Keluarga model AI open-source ringan dari Google DeepMind.", url: "https://ai.google.dev/gemma", gradient: ['#f472b6', '#fb7185'] },
    { name: "Copilot", logo: "images/explore/copilot.png", description: "Asisten AI Microsoft terintegrasi untuk produktivitas.", url: "https://copilot.microsoft.com/", gradient: ['#06b6d4', '#22d3ee'] },
    { name: "Hugging Face", logo: "images/explore/huggingface.png", description: "Komunitas & platform terdepan untuk model & dataset AI open-source.", url: "https://huggingface.co/", gradient: ['#fbbf24', '#fde047'] },
    { name: "Mistral AI", logo: "images/explore/mistral.png", description: "Pengembang model AI open-source berperforma tinggi dari Eropa.", url: "https://mistral.ai/", gradient: ['#a3a3a3', '#d4d4d4'] },
    { name: "Replicate", logo: "images/explore/replicate.png", description: "Jalankan model machine learning di cloud dengan API sederhana.", url: "https://replicate.com/", gradient: ['#4ade80', '#86efac'] },
    { name: "Anthropic", logo: "images/explore/anthropic.png", description: "Perusahaan riset & keamanan AI, pengembang model Claude.", url: "https://www.anthropic.com/", gradient: ['#f9a8d4', '#fda4af'] },
    { name: "Claude AI", logo: "images/explore/claude.png", description: "Asisten AI dari Anthropic yang fokus pada keamanan & kemampuan membantu.", url: "https://claude.ai/", gradient: ['#c084fc', '#d8b4fe'] },
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

// LOGIKA THEME TOGGLE
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
    const savedTheme = localStorage.getItem('novaria_theme');
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
    if (!clientIdMeta || !clientIdMeta.content) {
        console.error("Google Client ID tidak ditemukan.");
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Konfigurasi login error."; errorDiv.style.display = 'block';}
        const signInBtnContainer = document.getElementById('googleSignInButtonContainer');
        if(signInBtnContainer) signInBtnContainer.innerHTML = "<p style='font-size:0.8rem; color: var(--secondary-text-color);'>Login tidak tersedia.</p>";
        return;
    }
    const clientId = clientIdMeta.content;

    try {
        google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse });
        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if (signInButtonContainer) {
             if (localStorage.getItem('isLoggedIn') !== 'true') {
                google.accounts.id.renderButton(signInButtonContainer, { theme: "filled_black", size: "medium", type: "standard", shape: "pill", text: "signin", logo_alignment: "left" });
            } else {
                const user = JSON.parse(localStorage.getItem('novaUser'));
                const userName = user.givenName || user.name.split(' ')[0];
                signInButtonContainer.innerHTML = `<div class="user-greeting-header"><img src="${user.picture}" alt="${userName}" class="user-avatar-header"/><span>Hi, ${userName}!</span><a href="index.html" class="go-to-app-btn">Buka Aplikasi</a></div>`;
            }
        }
        // Tidak ada google.accounts.id.prompt() otomatis di sini
    } catch (error) {
        console.error("Google Identity Services init error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Gagal memuat layanan login Google."; errorDiv.style.display = 'block'; }
    }
};