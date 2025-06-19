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

    window.location.href = 'index.html';
}

// Data Kartu Fitur dengan ikon yang saya pilihkan
const featureCardsData = [
    {
        icon: "edit_document", // Ikon yang lebih spesifik untuk dokumen/esai
        title: "Makalah & Esai",
        description: "Nova bisa membantumu menulis makalah ilmiah, artikel, opini, laporan, dan tugas sekolah dengan struktur yang jelas dan bahasa yang baik.",
        image: "images/makalah-esai.png" // PASTIKAN PATH GAMBAR BENAR
    },
    {
        icon: "trending_up", // Ikon untuk tren, marketing, finance
        title: "Marketing Finance",
        description: "Analisis tren pasar, buat strategi marketing, dan kelola keuangan dengan bantuan insight dari Novaria.",
        image: "images/marketing-finance.png" // PASTIKAN PATH GAMBAR BENAR
    },
    {
        icon: "school", // Ikon untuk sekolah/tugas
        title: "Membantu Tugas",
        description: "Dapatkan bantuan untuk mengerjakan PR, riset materi pelajaran, dan persiapan ujian dengan Novaria.",
        image: "images/bantu-tugas.png" // PASTIKAN PATH GAMBAR BENAR
    },
    {
        icon: "psychology", // Ikon yang bisa merepresentasikan AI yang 'cerdas' dan 'ramah'
        title: "AI Profesional Ramah",
        description: "Novaria dirancang untuk menjadi partner AI yang profesional namun tetap ramah dan mudah diajak berinteraksi.",
        image: "images/ai-profesional.png" // PASTIKAN PATH GAMBAR BENAR
    },
    {
        icon: "summarize", // Ikon untuk merangkum atau menganalisis dokumen
        title: "Analisis Dokumen",
        description: "Unggah dokumen Anda dan biarkan Novaria membantu menganalisis, merangkum, atau mengekstrak informasi penting.",
        image: "images/analisis-dokumen.png" // PASTIKAN PATH GAMBAR BENAR
    }
];

function renderFeatureCards() {
    const grid = document.getElementById('featuresGrid');
    if (!grid) return;

    featureCardsData.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'feature-card';
        
        const iconName = card.icon || "help_outline"; // Default ikon jika tidak ada

        cardElement.innerHTML = `
            <div class="card-header">
                <span class="material-symbols-outlined card-icon">${iconName}</span>
                <h3>${card.title}</h3>
            </div>
            <p class="card-description">${card.description}</p>
            <div class="card-image-container">
                <img src="${card.image}" alt="${card.title}">
            </div>
            <button class="card-cta-button" data-feature-title="${card.title}">Coba Sekarang</button>
        `;
        grid.appendChild(cardElement);
    });

    // Tambahkan event listener untuk tombol "Coba Sekarang" di kartu
    document.querySelectorAll('.card-cta-button').forEach(button => {
        button.addEventListener('click', function() {
            const featureTitle = this.dataset.featureTitle;
            localStorage.setItem('loginTriggeredByCard', featureTitle);
            
            if (localStorage.getItem('isLoggedIn') === 'true') {
                // localStorage.setItem('initialChatMessage', `Saya tertarik dengan ${featureTitle}.`);
                window.location.href = 'index.html';
            } else {
                if (window.google && google.accounts && google.accounts.id) {
                    // Coba picu Google One Tap prompt.
                    // Jika tidak muncul, pengguna masih bisa klik tombol login di header.
                    google.accounts.id.prompt((notification) => {
                         if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            console.log('Google One Tap prompt was not displayed or skipped. User can use header login button.');
                            // Anda bisa, misalnya, men-scroll ke tombol login di header atau memberikan indikasi visual
                            const headerLoginButton = document.querySelector('#googleSignInButtonContainer button, #googleSignInButtonContainer > div > div');
                            if (headerLoginButton) {
                                headerLoginButton.focus(); // Beri fokus ke tombol login
                                // Tambahkan sedikit animasi untuk menarik perhatian jika perlu
                                headerLoginButton.style.transition = 'transform 0.2s ease-in-out';
                                headerLoginButton.style.transform = 'scale(1.05)';
                                setTimeout(() => {
                                    headerLoginButton.style.transform = 'scale(1)';
                                }, 400);
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
            errorDiv.textContent = "Login configuration is missing. Please contact support.";
            errorDiv.style.display = 'block';
        }
        // Sembunyikan atau nonaktifkan elemen yang bergantung pada Google Sign-In
        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if(signInButtonContainer) signInButtonContainer.innerHTML = "<p>Login service unavailable.</p>";
        return;
    }
    const clientId = clientIdMeta.content;

    try {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
        });

        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if (signInButtonContainer) {
             if (localStorage.getItem('isLoggedIn') !== 'true') {
                google.accounts.id.renderButton(
                    signInButtonContainer,
                    { 
                        theme: "filled_black", // Pilihan tema: "outline", "filled_blue", "filled_black"
                        size: "medium",    // "small", "medium", "large"
                        type: "standard", 
                        shape: "pill", // "rectangular", "pill", "circle", "square"
                        text: "signin_with", 
                        logo_alignment: "left",
                    } 
                );
            } else {
                const user = JSON.parse(localStorage.getItem('novaUser'));
                const userName = user.givenName || user.name.split(' ')[0]; // Ambil nama depan
                signInButtonContainer.innerHTML = `
                    <div class="user-greeting-header">
                        <img src="${user.picture}" alt="User" class="user-avatar-header"/>
                        <span>Hi, ${userName}!</span>
                        <a href="index.html" class="go-to-app-btn">Go to App</a>
                    </div>`;
            }
        }

        if (localStorage.getItem('isLoggedIn') !== 'true') {
           // Pertimbangkan untuk tidak otomatis memanggil prompt() di onload jika ada tombol login yang jelas.
           // Ini bisa mengganggu jika pengguna hanya ingin melihat halaman.
           // google.accounts.id.prompt(); 
        }

    } catch (error) {
        console.error("Google Identity Services initialization error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) {
            errorDiv.textContent = "Could not initialize Google Sign-In. Please try again later.";
            errorDiv.style.display = 'block';
        }
    }
};
