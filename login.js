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

// MODIFIKASI: handleCredentialResponse untuk membaca redirectAfterLogin
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
    
    // Baca tujuan redirect dari localStorage
    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html'; // Default ke index.html
    localStorage.removeItem('redirectAfterLogin'); // Hapus flag setelah dibaca
    
    // Hapus juga flag loginTriggeredByCard jika ada, karena sudah ditangani
    if (localStorage.getItem('loginTriggeredByCard')) { 
        localStorage.removeItem('loginTriggeredByCard'); 
    }

    window.location.href = redirectUrl; // Arahkan ke URL yang disimpan atau default
}

// DATA UNTUK FITUR UNGGULAN NOVARIA
const featureCardsData = [
    { icon: "edit_document", title: "Makalah & Esai", description: "Nova bisa membantumu menulis makalah ilmiah, artikel, opini, laporan, dan tugas sekolah dengan struktur yang jelas dan bahasa yang baik.", image: "images/makalah-esai.png", actionType: "default_redirect" },
    { icon: "trending_up", title: "Marketing Finance", description: "Analisis tren pasar, buat strategi marketing, dan kelola keuangan dengan bantuan insight dari Novaria.", image: "images/marketing-finance.png", actionType: "default_redirect" },
    { icon: "school", title: "Membantu Tugas", description: "Dapatkan bantuan untuk mengerjakan PR, riset materi pelajaran, dan persiapan ujian dengan Novaria.", image: "images/bantu-tugas.png", actionType: "default_redirect" },
    { icon: "psychology", title: "AI Profesional Ramah", description: "Novaria dirancang untuk menjadi partner AI yang profesional namun tetap ramah dan mudah diajak berinteraksi.", image: "images/ai-profesional.png", actionType: "default_redirect" },
    { icon: "summarize", title: "Analisis Dokumen", description: "Unggah dokumen Anda dan biarkan Novaria membantu menganalisis, merangkum, atau mengekstrak informasi penting.", image: "images/analisis-dokumen.png", actionType: "default_redirect" },
    // ===== KARTU BARU DENGAN actionType KHUSUS =====
    { 
        icon: "palette", // Atau ikon lain seperti 'image', 'brush'
        title: "Generate Image", 
        description: "Buat gambar unik dan kreatif dari deskripsi teks Anda dengan kekuatan AI.", 
        image: "images/generate-image-feature.png", // PASTIKAN GAMBAR INI ADA di images/
        actionType: "go_to_image_page" 
    }
    // ============================================
];

function renderFeatureCards() {
    const grid = document.getElementById('featuresGrid');
    if (!grid) { console.error("Element #featuresGrid tidak ditemukan untuk fitur Novaria."); return; }
    grid.innerHTML = '';
    featureCardsData.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'feature-card';
        const iconName = card.icon || "help_outline";
        // MODIFIKASI: Tambahkan data-action-type ke tombol
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

    // MODIFIKASI: Event listener untuk tombol kartu
    document.querySelectorAll('#featuresGrid .card-cta-button').forEach(button => {
        button.addEventListener('click', function() {
            const featureTitle = this.dataset.featureTitle;
            const actionType = this.dataset.actionType;

            localStorage.setItem('loginTriggeredByCard', featureTitle); // Info umum kartu apa yang diklik

            if (localStorage.getItem('isLoggedIn') === 'true') {
                // Jika sudah login, langsung arahkan
                if (actionType === "go_to_image_page") {
                    window.location.href = 'image.html';
                } else {
                    // Untuk kartu lain, bisa tetap ke index.html atau simpan info fitur jika perlu
                    // localStorage.setItem('initialChatMessage', `Saya ingin mencoba fitur: ${featureTitle}`);
                    window.location.href = 'index.html';
                }
            } else {
                // Jika belum login, simpan tujuan redirect setelah login berhasil
                if (actionType === "go_to_image_page") {
                    localStorage.setItem('redirectAfterLogin', 'image.html');
                } else {
                    localStorage.setItem('redirectAfterLogin', 'index.html'); // Default redirect
                }
                
                // Memicu prompt login Google One Tap
                if (window.google && google.accounts && google.accounts.id) {
                    google.accounts.id.prompt(notification => {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            console.log('Google One Tap tidak ditampilkan. Pengguna dapat menggunakan tombol login di header.');
                            const headerLoginButton = document.querySelector('#googleSignInButtonContainer button, #googleSignInButtonContainer > div > div');
                            if (headerLoginButton) { 
                                headerLoginButton.focus(); 
                                // Tambahkan efek visual ke tombol login header jika One Tap tidak muncul
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

// DATA UNTUK KARTU JELAJAHI AI LAIN (tetap sama)
const exploreAiData = [
    { name: "Monica.im", logo: "images/explore/monica.png", description: "Asisten AI serbaguna untuk browsing, menulis, dan berkreasi dengan dukungan GPT-4.", url: "https://monica.im/", gradient: ['#f0abfc', '#a855f7'] },
    // ... (sisa data exploreAiData seperti sebelumnya, pastikan path logo benar) ...
    { name: "Gemini", logo: "images/explore/gemini.png", description: "Model AI multimodal paling canggih dari Google DeepMind.", url: "https://deepmind.google/technologies/gemini/", gradient: ['#3b82f6', '#60a5fa'] }
];

function renderExploreAiCards() {
    // ... (fungsi renderExploreAiCards tetap sama seperti sebelumnya) ...
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

// LOGIKA THEME TOGGLE (tetap sama)
function applyLoginTheme(isLightMode) {
    // ... (fungsi applyLoginTheme tetap sama) ...
    if (isLightMode) {
        document.body.classList.add('light-mode');
        localStorage.setItem('novaria_theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('novaria_theme', 'dark');
    }
}

function setupLoginThemeToggle() {
    // ... (fungsi setupLoginThemeToggle tetap sama) ...
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

    if (document.getElementById('featuresGrid')) { renderFeatureCards(); } // Memanggil render fitur Novaria
    if (document.getElementById('exploreAiGrid')) { renderExploreAiCards(); } // Memanggil render jelajah AI
    
    setupLoginThemeToggle(); // Setup theme toggle

    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    if (!clientIdMeta || !clientIdMeta.content || clientIdMeta.content === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
        console.error("Google Client ID tidak ditemukan atau belum diganti.");
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Konfigurasi login tidak valid. Harap periksa Client ID."; errorDiv.style.display = 'block';}
        const signInBtnContainer = document.getElementById('googleSignInButtonContainer');
        if(signInBtnContainer) signInBtnContainer.innerHTML = "<p style='font-size:0.8rem; color: var(--secondary-text-color);'>Layanan login tidak tersedia sementara.</p>";
        return;
    }
    const clientId = clientIdMeta.content;

    try {
        // Upaya untuk Mencegah One Tap Muncul Otomatis
        if (window.google && google.accounts && google.accounts.id && typeof google.accounts.id.disableAutoSelect === 'function') {
            google.accounts.id.disableAutoSelect();
        }

        google.accounts.id.initialize({ 
            client_id: clientId, 
            callback: handleCredentialResponse 
            // Tidak ada auto_select: true
        });

        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if (signInButtonContainer) {
             if (localStorage.getItem('isLoggedIn') !== 'true') {
                google.accounts.id.renderButton(signInButtonContainer, { 
                    theme: "filled_black", 
                    size: "medium",    
                    type: "standard", 
                    shape: "pill", 
                    text: "signin", // Untuk teks "Login" atau "Masuk"
                    logo_alignment: "left" 
                });
            } else {
                const user = JSON.parse(localStorage.getItem('novaUser'));
                const userName = user.givenName || user.name.split(' ')[0];
                signInButtonContainer.innerHTML = `<div class="user-greeting-header"><img src="${user.picture}" alt="${userName}" class="user-avatar-header"/><span>Hi, ${userName}!</span><a href="index.html" class="go-to-app-btn">Buka Aplikasi</a></div>`;
            }
        }
        // Tidak ada pemanggilan google.accounts.id.prompt() otomatis di sini
    } catch (error) {
        console.error("Google Identity Services init error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Gagal memuat layanan login Google."; errorDiv.style.display = 'block'; }
    }
};