// login.js

// Fungsi jwt_decode tetap sama
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
        if (errorDiv) {
            errorDiv.textContent = "Login failed: Invalid token received.";
            errorDiv.style.display = 'block';
        }
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
    
    const cardTriggeredLogin = localStorage.getItem('loginTriggeredByCard');
    if (cardTriggeredLogin) {
        // Opsional: Anda bisa mengirim ini ke halaman chat
        // localStorage.setItem('initialChatMessage', `Saya tertarik dengan ${cardTriggeredLogin}.`);
        localStorage.removeItem('loginTriggeredByCard');
    }

    window.location.href = 'index.html'; // Arahkan ke halaman utama aplikasi
}

// Data Kartu Fitur (Pastikan path gambar dan nama ikon benar)
const featureCardsData = [
    {
        icon: "edit_document", 
        title: "Makalah & Esai",
        description: "Nova bisa membantumu menulis makalah ilmiah, artikel, opini, laporan, dan tugas sekolah dengan struktur yang jelas dan bahasa yang baik.",
        image: "images/makalah-esai.png"
    },
    {
        icon: "trending_up", 
        title: "Marketing Finance",
        description: "Analisis tren pasar, buat strategi marketing, dan kelola keuangan dengan bantuan insight dari Novaria.",
        image: "images/marketing-finance.png"
    },
    {
        icon: "school", 
        title: "Membantu Tugas",
        description: "Dapatkan bantuan untuk mengerjakan PR, riset materi pelajaran, dan persiapan ujian dengan Novaria.",
        image: "images/bantu-tugas.png"
    },
    {
        icon: "psychology", 
        title: "AI Profesional Ramah",
        description: "Novaria dirancang untuk menjadi partner AI yang profesional namun tetap ramah dan mudah diajak berinteraksi.",
        image: "images/ai-profesional.png"
    },
    {
        icon: "summarize", 
        title: "Analisis Dokumen",
        description: "Unggah dokumen Anda dan biarkan Novaria membantu menganalisis, merangkum, atau mengekstrak informasi penting.",
        image: "images/analisis-dokumen.png"
    }
];

function renderFeatureCards() {
    const grid = document.getElementById('featuresGrid');
    if (!grid) return;

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

    document.querySelectorAll('.card-cta-button').forEach(button => {
        button.addEventListener('click', function() {
            const featureTitle = this.dataset.featureTitle;
            localStorage.setItem('loginTriggeredByCard', featureTitle);
            
            if (localStorage.getItem('isLoggedIn') === 'true') {
                window.location.href = 'index.html';
            } else {
                if (window.google && google.accounts && google.accounts.id) {
                    // Panggil One Tap prompt saat tombol "Coba Sekarang" diklik jika belum login
                    google.accounts.id.prompt((notification) => {
                         if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            console.log('Google One Tap prompt was not displayed or skipped when "Coba Sekarang" was clicked.');
                            // Pengguna masih bisa menggunakan tombol "Login" di header
                            const headerLoginButton = document.querySelector('#googleSignInButtonContainer button, #googleSignInButtonContainer > div > div');
                            if (headerLoginButton) {
                                headerLoginButton.focus();
                                headerLoginButton.style.outline = '2px solid var(--accent-gradient-start)';
                                setTimeout(() => { headerLoginButton.style.outline = 'none'; }, 2000);
                            }
                        }
                    });
                } else {
                    console.error("Google Identity Services not available to trigger prompt.");
                }
            }
        });
    });
}

window.onload = function () {
    const currentYearSpanLogin = document.getElementById('currentYearLogin');
    if (currentYearSpanLogin) {
        currentYearSpanLogin.textContent = new Date().getFullYear();
    }

    renderFeatureCards();

    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    if (!clientIdMeta || !clientIdMeta.content) {
        console.error("Google Client ID not found in meta tag.");
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) {
            errorDiv.textContent = "Konfigurasi login tidak ditemukan. Harap hubungi dukungan.";
            errorDiv.style.display = 'block';
        }
        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if(signInButtonContainer) signInButtonContainer.innerHTML = "<p style='font-size:0.8rem; color: var(--secondary-text-color);'>Layanan login tidak tersedia.</p>";
        return;
    }
    const clientId = clientIdMeta.content;

    try {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            // auto_select: false, // Defaultnya false, tidak perlu eksplisit jika tidak ingin auto select
        });

        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if (signInButtonContainer) {
             if (localStorage.getItem('isLoggedIn') !== 'true') {
                google.accounts.id.renderButton(
                    signInButtonContainer,
                    { 
                        theme: "filled_black", 
                        size: "medium",    
                        type: "standard", 
                        shape: "pill", 
                        text: "signin", // <<<--- PERUBAHAN DI SINI: "signin" untuk teks "Login" atau "Masuk" (tergantung lokal Google)
                                        // Google akan otomatis melokalisasi ini. "signin" adalah opsi paling pendek.
                                        // Opsi lain: "signin_with" (Sign in with Google), "continue_with" (Continue with Google)
                        logo_alignment: "left", // Logo Google tetap di kiri
                    } 
                );
            } else {
                const user = JSON.parse(localStorage.getItem('novaUser'));
                const userName = user.givenName || user.name.split(' ')[0];
                signInButtonContainer.innerHTML = `
                    <div class="user-greeting-header">
                        <img src="${user.picture}" alt="${userName}" class="user-avatar-header"/>
                        <span>Hi, ${userName}!</span>
                        <a href="index.html" class="go-to-app-btn">Buka Aplikasi</a>
                    </div>`;
            }
        }

        // TIDAK ADA PEMANGGILAN google.accounts.id.prompt() OTOMATIS DI SINI
        // One Tap hanya akan muncul jika dipicu oleh aksi pengguna (misal klik "Coba Sekarang")

    } catch (error) {
        console.error("Google Identity Services initialization error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) {
            errorDiv.textContent = "Tidak dapat menginisialisasi layanan Google Sign-In. Coba lagi nanti.";
            errorDiv.style.display = 'block';
        }
    }
};
