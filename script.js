// script.js (Untuk index.html)

document.addEventListener('DOMContentLoaded', () => {
    console.log("SCRIPT.JS: DOMContentLoaded fired!");

    // === AWAL: PENGECEKAN LOGIN ===
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser'); // Ganti jika key beda
    let currentUser = null;

    if (isLoggedIn === 'true' && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (!currentUser || !currentUser.name) {
                throw new Error("Invalid user data in storage.");
            }
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded');
            console.log("SCRIPT.JS: User authenticated.");
            updateUserProfileSidebar(currentUser); // Panggil fungsi untuk update UI profil
        } catch (e) {
            console.error("SCRIPT.JS: Error parsing user data:", e.message);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser');
            window.location.href = 'login.html';
            return;
        }
    } else {
        console.log("SCRIPT.JS: Not logged in. Redirecting.");
        window.location.href = 'login.html';
        return;
    }
    // === AKHIR: PENGECEKAN LOGIN ===

    // --- SELEKTOR DOM ---
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const menuIcon = document.getElementById('menuIcon');
    const backIcon = document.getElementById('backIcon'); // Untuk kembali dari chat ke welcome
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    // Item Sidebar Baru
    const userProfileSidebar = document.getElementById('userProfileSidebar');
    const loginButtonSidebar = document.getElementById('loginButtonSidebar');
    const logoutButtonSidebar = document.getElementById('logoutButtonSidebar');
    const themeToggleSidebar = document.getElementById('themeToggleSidebar'); // Toggle tema di sidebar
    const themeToggleLanding = document.getElementById('themeToggleLanding'); // Toggle tema di header (welcome page)

    const chatHistory = document.getElementById('chatHistory');
    const thinkingIndicator = document.getElementById('thinkingIndicator');
    const welcomeSection = document.getElementById('welcomeSection');
    const chatSection = document.getElementById('chatSection');
    const landingThemeToggleContainer = document.getElementById('landingThemeToggleContainer');
    const mainContent = document.querySelector('main');

    // Modal (jika masih digunakan)
    const infoModalOverlay = document.getElementById('infoModalOverlay');
    const modalCloseBtnModal = document.getElementById('modalCloseBtnModal'); // ID baru untuk tombol close modal
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    // Fitur Upload & Voice (jika ada)
    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    const fileChipContainer = document.getElementById('fileChipContainer');
    const voiceInputButton = document.getElementById('voiceInputButton');
    let attachedFiles = [];
    let recognition;

    let currentActivePage = 'welcome'; // Halaman default saat masuk

    // --- FUNGSI-FUNGSI ---

    function updateUserProfileSidebar(user) {
        if (userProfileSidebar && user) {
            userProfileSidebar.innerHTML = `
                <img src="${user.picture}" alt="${user.name}" class="profile-avatar-sidebar">
                <div class="profile-info-sidebar">
                    <span class="profile-name-sidebar">${user.name}</span>
                    <span class="profile-email-sidebar">${user.email}</span>
                </div>
            `;
            if (logoutButtonSidebar) logoutButtonSidebar.style.display = 'flex'; // Tampilkan tombol logout
            if (loginButtonSidebar) loginButtonSidebar.style.display = 'none';  // Sembunyikan tombol login
        } else if (userProfileSidebar) {
            userProfileSidebar.innerHTML = `
                <span class="material-symbols-outlined">account_circle</span>
                <span>Anda belum login</span>
            `;
            if (logoutButtonSidebar) logoutButtonSidebar.style.display = 'none';
            if (loginButtonSidebar) loginButtonSidebar.style.display = 'flex';
        }
    }

    function handleLogout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('novaUser');
        // Opsional: Google Sign-Out
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
           google.accounts.id.disableAutoSelect();
           // Jika ingin revoke token sepenuhnya (pengguna harus login ulang di semua sesi Google):
           // if (currentUser && currentUser.email) {
           //     google.accounts.id.revoke(currentUser.email, done => {
           //         console.log('Google token revoked.');
           //         window.location.href = 'login.html';
           //     });
           // } else {
           //     window.location.href = 'login.html';
           // }
        }
        window.location.href = 'login.html';
    }

    function applyTheme(isLightMode) {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('novaria_theme', 'light'); // Gunakan satu key konsisten
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('novaria_theme', 'dark');
        }
        if (themeToggleSidebar) themeToggleSidebar.checked = isLightMode;
        if (themeToggleLanding) themeToggleLanding.checked = isLightMode;
    }

    function setupTheme() {
        const savedTheme = localStorage.getItem('novaria_theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        let initialLightMode;

        if (savedTheme === 'light') {
            initialLightMode = true;
        } else if (savedTheme === 'dark') {
            initialLightMode = false;
        } else {
            initialLightMode = !prefersDark; // Default ke tema sistem, atau light jika tidak ada preferensi
        }
        applyTheme(initialLightMode);

        if (themeToggleSidebar) {
            themeToggleSidebar.addEventListener('change', () => applyTheme(themeToggleSidebar.checked));
        }
        if (themeToggleLanding) {
            themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));
        }
    }

    function openModal(targetKey) {
        // Asumsikan konten modal ada di objek translations atau diambil dari tempat lain
        // Untuk contoh, kita tampilkan targetKey saja
        const modalContentData = {
            privacyPolicySidebar: { title: "Kebijakan Privasi", content: "<p>Konten kebijakan privasi di sini...</p><p>Ini adalah contoh. Anda perlu mengisi konten sebenarnya.</p>" },
            termsAndConditionsSidebar: { title: "Syarat & Ketentuan", content: "<p>Konten syarat dan ketentuan di sini...</p>" }
        };

        if (modalContentData[targetKey] && infoModalOverlay && modalTitle && modalBody && modalCloseBtnModal) {
            modalTitle.textContent = modalContentData[targetKey].title;
            modalBody.innerHTML = modalContentData[targetKey].content;
            infoModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Mencegah scroll body saat modal terbuka
        } else {
            console.warn("Modal target atau elemen modal tidak ditemukan:", targetKey);
        }
    }

    function closeModal() {
        if (infoModalOverlay) {
            infoModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function showPage(pageName, initialMessage = null) {
        // ... (Fungsi showPage tetap sama seperti yang Anda berikan sebelumnya)
        // Pastikan ID section sesuai dengan 'welcomeSection' dan 'chatSection'
        if (currentActivePage === pageName && !initialMessage) return;
        const currentPageElement = document.getElementById(currentActivePage + 'Section');
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
            setTimeout(() => { currentPageElement.classList.add('hidden'); }, 500);
        }
        const nextPageElement = document.getElementById(pageName + 'Section');
        if (nextPageElement) {
            nextPageElement.classList.remove('hidden');
            setTimeout(() => { nextPageElement.classList.add('active'); }, 10);
        }
        currentActivePage = pageName;
        if (pageName === 'chat') {
            if(landingThemeToggleContainer) landingThemeToggleContainer.classList.add('hidden');
            if(menuIcon) menuIcon.classList.add('hidden');
            if(backIcon) backIcon.classList.remove('hidden');
            // quickCompleteContainer.classList.remove('active'); // Jika fitur ini ada
        } else { // Welcome page
            if(landingThemeToggleContainer) landingThemeToggleContainer.classList.remove('hidden');
            if(menuIcon) menuIcon.classList.remove('hidden');
            if(backIcon) backIcon.classList.add('hidden');
            // if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
            //     quickCompleteContainer.classList.add('active'); // Jika fitur ini ada
            // }
        }
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user'); // Fungsi ini perlu didefinisikan
            generateRealAIResponse(initialMessage, attachedFiles); // Fungsi ini perlu didefinisikan
        }
        // updateInputAreaAppearance(); // Fungsi ini perlu didefinisikan
    }

    // ... (Definisikan fungsi: addChatMessage, generateRealAIResponse, addAiMessageActions, autoResizeTextarea, dll. seperti di script.js Anda sebelumnya)
    // Saya akan sertakan versi dasarnya di bawah. Sesuaikan jika perlu.

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """).replace(/'/g, "'");
    }

    function addChatMessage(content, sender = 'user') { /* ... (sama seperti sebelumnya) ... */ }
    async function generateRealAIResponse(userMessage, files = []) { /* ... (sama seperti sebelumnya, panggil /api/generate) ... */ }
    function addAiMessageActions(aiMessageElement) { /* ... (sama seperti sebelumnya) ... */ }
    function autoResizeTextarea() { /* ... (sama seperti sebelumnya) ... */ }
    function updateInputAreaAppearance() { /* ... (sama seperti sebelumnya) ... */ }
    function displayFileChipItem(file) { /* ... (sama seperti sebelumnya) ... */ }
    function removeAttachedFile(fileName, fileSize) { /* ... (sama seperti sebelumnya) ... */ }
    function clearAttachedFiles() { /* ... (sama seperti sebelumnya) ... */ }


    // --- EVENT LISTENERS ---
    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            if (sidebar) sidebar.classList.add('active');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        });
    }
    if (sidebarCloseBtn) { // Tombol close baru di header sidebar
        sidebarCloseBtn.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        });
    }

    if (backIcon) { // Tombol kembali dari chat ke welcome
        backIcon.addEventListener('click', () => {
            showPage('welcome');
            if (chatHistory && thinkingIndicator) {
                 chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`;
            } else if (chatHistory) {
                chatHistory.innerHTML = '';
            }
            if(messageInput) messageInput.value = '';
            autoResizeTextarea();
            clearAttachedFiles();
            // updateInputAreaAppearance();
        });
    }

    if (logoutButtonSidebar) {
        logoutButtonSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            const targetKey = this.dataset.modalTarget;
            openModal(targetKey);
        });
    });

    if (modalCloseBtnModal) {
        modalCloseBtnModal.addEventListener('click', closeModal);
    }
    if (infoModalOverlay) {
        infoModalOverlay.addEventListener('click', (e) => {
            if (e.target === infoModalOverlay) {
                closeModal();
            }
        });
    }

    // Event listener untuk tombol send, input, dll. (seperti di script.js Anda sebelumnya)
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => { /* ... logika send ... */ });
        messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });
        messageInput.addEventListener('input', autoResizeTextarea);
    }
    if (plusButton && fileInput) {
        plusButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => { /* ... logika handle file ... */});
    }
    // ... (event listener lain jika ada, misal voice input)


    // --- INISIALISASI HALAMAN ---
    setupTheme(); // Panggil setup tema
    if (currentUser) { // Hanya panggil jika currentUser berhasil di-set
        updateUserProfileSidebar(currentUser); // Update profil di sidebar
    } else {
        // Jika currentUser null (misalnya karena redirect di-bypass untuk debug)
        updateUserProfileSidebar(null); // Tampilkan status belum login
    }

    // Logika halaman awal (welcome atau chat berdasarkan initialChatMessage)
    const initialChatMessageFromStorage = localStorage.getItem('initialChatMessage');
    if (initialChatMessageFromStorage) {
        localStorage.removeItem('initialChatMessage');
        showPage('chat', initialChatMessageFromStorage);
    } else if (isLoggedIn === 'true') {
        showPage('welcome'); // Default ke welcome jika sudah login & tidak ada initial chat
    }
    // Jika tidak login, sudah di-redirect di awal

    console.log("SCRIPT.JS: All initializations complete.");

}); // Akhir DOMContentLoaded


// Fungsi global jika ada (seperti copyCode, formatFileSize) bisa ditaruh di sini
// Pastikan fungsi addChatMessage, generateRealAIResponse, dll., didefinisikan dengan benar
// di dalam lingkup DOMContentLoaded atau secara global jika dipanggil dari luar.
// Untuk contoh ini, saya asumsikan versi singkatnya ada di atas.