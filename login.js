// login.js

// === Google Sign-In Callbacks ===
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

    // Tutup modal setelah login
    closeLoginModal();
    // Perbarui tombol header
    updateHeaderAuthButton();

    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
    localStorage.removeItem('redirectAfterLogin');
    localStorage.removeItem('loginTriggeredByCard'); // Clear this flag

    window.location.href = redirectUrl;
}

// === Header Auth Button Management ===
function updateHeaderAuthButton() {
    const headerAuthPlaceholder = document.getElementById('headerAuthPlaceholder');
    if (!headerAuthPlaceholder) return;

    headerAuthPlaceholder.innerHTML = ''; // Clear previous button/initial

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('novaUser');
    let currentUser = null;

    if (isLoggedIn && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (!currentUser || !currentUser.name) {
                // Invalid user data, force logout
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('novaUser');
                currentUser = null;
            }
        } catch (e) {
            console.error("Error parsing user data in header:", e);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser');
            currentUser = null;
        }
    }

    if (currentUser) {
        // Display user initial button
        const initial = (currentUser.givenName || currentUser.name || 'U').charAt(0).toUpperCase();
        const userButton = document.createElement('button');
        userButton.className = 'auth-button user-initial-button';
        userButton.textContent = initial;
        userButton.title = currentUser.name || currentUser.email;

        userButton.addEventListener('click', () => {
            // Optional: You can add a small dropdown here for logout/profile link
            // For now, it simply shows an alert or does nothing
            alert(`Logged in as ${currentUser.name || currentUser.email}`);
        });

        headerAuthPlaceholder.appendChild(userButton);
    } else {
        // Display "Log In" button
        const loginButton = document.createElement('button');
        loginButton.id = 'headerLoginButton'; // ID for specific targeting
        loginButton.className = 'auth-button';
        loginButton.textContent = 'Log In';
        loginButton.addEventListener('click', openLoginModal);
        headerAuthPlaceholder.appendChild(loginButton);
    }
}

// === Login Modal Logic ===
const loginModalOverlay = document.getElementById('loginModalOverlay');
const loginModalContent = document.getElementById('loginModalContent');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const manualLoginBtn = document.getElementById('manualLoginBtn'); // For future manual login

function openLoginModal() {
    loginModalOverlay.classList.add('active');
    loginModalContent.classList.add('active');
    // Render Google button inside the modal when it opens
    const googleButtonContainer = document.getElementById('googleButtonContainer');
    if (googleButtonContainer && !googleButtonContainer.hasChildNodes()) {
        google.accounts.id.renderButton(googleButtonContainer, {
            theme: "filled_black", // Or "outline", based on your design
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "continue_with",
            logo_alignment: "left",
            width: 250 // Set a fixed width or use 'auto' and let CSS handle
        });
    }
}

function closeLoginModal() {
    loginModalOverlay.classList.remove('active');
    loginModalContent.classList.remove('active');
}

// Event listeners for modal
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeLoginModal);
}
if (loginModalOverlay) {
    loginModalOverlay.addEventListener('click', (event) => {
        if (event.target === loginModalOverlay) {
            closeLoginModal();
        }
    });
}

// Placeholder for manual login (no actual auth)
if (manualLoginBtn) {
    manualLoginBtn.addEventListener('click', () => {
        const email = document.getElementById('manualEmail').value;
        const password = document.getElementById('manualPassword').value;
        if (email && password) {
            alert('Manual login attempted (backend not implemented).');
            // Simulate successful login for demonstration
            const demoUser = {
                id: 'manual_user',
                name: email.split('@')[0],
                givenName: email.split('@')[0],
                picture: 'https://via.placeholder.com/150/007bff/ffffff?text=' + email.charAt(0).toUpperCase(), // Placeholder image
                email: email
            };
            localStorage.setItem('novaUser', JSON.stringify(demoUser));
            localStorage.setItem('isLoggedIn', 'true');
            closeLoginModal();
            updateHeaderAuthButton();
            // Redirect as if real login
            const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else {
            alert('Please enter email and password for manual login.');
        }
    });
}


// === DATA AND RENDERING FOR MARKETING SECTIONS (UNCHANGED) ===
const featureCardsData = [
    {
        icon: "psychology",
        title: "AI Profesional Ramah",
        description: "Novaria dirancang untuk menjadi partner AI yang profesional namun tetap ramah dan mudah diajak berinteraksi.",
        image: "images/ai-profesional.png",
        actionType: "default_redirect"
    },
    {
        icon: "palette",
        title: "Generate Image",
        description: "Buat gambar unik dan kreatif dari deskripsi teks Anda dengan kekuatan AI.",
        image: "images/generate-image-feature.png",
        actionType: "go_to_image_page"
    },
    {
        icon: "code_blocks",
        title: "Codex Generator",
        description: "Rancang, tulis, dan debug kode dalam berbagai bahasa pemrograman dengan bantuan AI coder canggih.",
        image: "images/codex-generator-feature.png",
        actionType: "go_to_codex_page"
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

            // Save the intention to redirect after login
            localStorage.setItem('loginTriggeredByCard', featureTitle);

            if (localStorage.getItem('isLoggedIn') === 'true') {
                if (actionType === "go_to_image_page") {
                    window.location.href = 'image.html';
                } else if (actionType === "go_to_codex_page") {
                    window.location.href = 'codex.html';
                } else { // default_redirect
                    window.location.href = 'index.html';
                }
            } else {
                // If not logged in, set redirect target and open modal
                if (actionType === "go_to_image_page") {
                    localStorage.setItem('redirectAfterLogin', 'image.html');
                } else if (actionType === "go_to_codex_page") {
                    localStorage.setItem('redirectAfterLogin', 'codex.html');
                } else { // default_redirect
                    localStorage.setItem('redirectAfterLogin', 'index.html');
                }

                openLoginModal(); // Open the new login modal
            }
        });
    });
}

const exploreAiData = [
    { name: "Monica", logo: "images/explore/monica.png", description: "Asisten AI serbaguna untuk browsing, menulis, dan berkreasi dengan dukungan GPT-4.", url: "https://monica.im/", gradient: ['#f0abfc', '#a855f7'] },
    { name: "Qwen 2.5", logo: "images/explore/qwen.png", description: "Mesin penjawab bertenaga AI yang menyediakan sumber dan kutipan akurat.", url: "https://www.perplexity.ai/", gradient: ['#38bdf8', '#0ea5e9'] },
    { name: "Hugging Face", logo: "images/explore/huggingface.png", description: "Komunitas dan platform untuk model machine learning open-source.", url: "https://huggingface.co/", gradient: ['#facc15', '#eab308'] },
    { name: "Claude AI", logo: "images/explore/claude.png", description: "Model bahasa besar dari Anthropic dengan fokus pada keamanan dan keandalan.", url: "https://claude.ai/", gradient: ['#f97316', '#ea580c'] },
    { name: "GitHub Copilot", logo: "images/explore/copilot.png", description: "Pair programmer AI yang membantu Anda menulis kode lebih cepat dan lebih baik.", url: "https://github.com/features/copilot", gradient: ['#6b7280', '#4b5563'] },
    { name: "ChatGPT", logo: "images/explore/chatgpt.png", description: "Suite alat kreatif bertenaga AI untuk generasi video, gambar, dan lainnya.", url: "https://runwayml.com/", gradient: ['#ec4899', '#db2777'] },
    { name: "DeepSeek", logo: "images/explore/deepseek.png", description: "Laboratorium riset independen yang menghasilkan gambar dari deskripsi teks.", url: "https://www.midjourney.com/", gradient: ['#8b5cf6', '#7c3aed'] },
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

// === Theme Toggle Logic (UNCHANGED) ===
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
    // Theme toggle has been removed from login.html header as per user request (image references)
    // If you need it back, you'll need to re-add the HTML and this JS logic will then apply.
    // For now, removing the reference to themeToggleLogin as it no longer exists in login.html.
    // const themeToggleLogin = document.getElementById('themeToggleLogin');
    // if (!themeToggleLogin) return;
    // const savedTheme = localStorage.getItem('novaria_theme');
    // if (savedTheme === 'light') {
    //     themeToggleLogin.checked = true;
    //     applyLoginTheme(true);
    // } else {
    //     themeToggleLogin.checked = false;
    //     applyLoginTheme(false);
    // }
    // themeToggleLogin.addEventListener('change', () => {
    //     applyLoginTheme(themeToggleLogin.checked);
    // });
}

// === Initialize on Load ===
window.onload = function () {
    const currentYearSpanLogin = document.getElementById('currentYearLogin');
    if (currentYearSpanLogin) { currentYearSpanLogin.textContent = new Date().getFullYear(); }

    if (document.getElementById('featuresGrid')) { renderFeatureCards(); }
    if (document.getElementById('exploreAiGrid')) { renderExploreAiCards(); }

    setupLoginThemeToggle(); // This will no longer do anything if themeToggleLogin is removed from HTML

    // Initialize Google Sign-In
    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    if (!clientIdMeta || !clientIdMeta.content || clientIdMeta.content === "870787988649-sj4pcmpa5t6ms6a1kgvsmvsc1tuh1ngu.apps.googleusercontent.com" || clientIdMeta.content.length < 20) {
        console.error("Google Client ID tidak ditemukan, belum diganti, atau tidak valid. Gunakan Client ID Anda.");
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Konfigurasi login tidak valid. Harap periksa Client ID."; errorDiv.style.display = 'block';}
        const headerAuthPlaceholder = document.getElementById('headerAuthPlaceholder');
        if(headerAuthPlaceholder) headerAuthPlaceholder.innerHTML = "<p style='font-size:0.8rem; color: var(--secondary-text-color);'>Login dinonaktifkan.</p>";
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

        // Initial render of the header auth button based on login status
        updateHeaderAuthButton();

    } catch (error) {
        console.error("Google Identity Services init error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) { errorDiv.textContent = "Gagal memuat layanan login Google."; errorDiv.style.display = 'block'; }
    }
};