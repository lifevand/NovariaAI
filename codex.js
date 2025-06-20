// codex.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("CODEX.JS: DOMContentLoaded fired!");

    function displayCriticalError(message) {
        document.body.classList.remove('app-hidden');
        document.body.classList.add('app-loaded');
        document.body.style.backgroundColor = 'darkred';
        document.body.innerHTML = `<div style="color:white; padding:30px; font-family:monospace; font-size:16px;"><h1>Initialization Error</h1><p>${message}</p></div>`;
        console.error("CODEX.JS: CRITICAL ERROR - " + message);
    }

    // --- PENGECEKAN LOGIN ---
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser'); // Ganti 'novaUser' jika key Anda berbeda
    let currentUser = null;

    if (isLoggedIn === 'true' && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (!currentUser || !currentUser.name) { // Validasi sederhana
                throw new Error("Data pengguna tidak valid atau properti 'name' tidak ditemukan.");
            }
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded');
            console.log("CODEX.JS: User authenticated, body classes updated.");
        } catch (e) {
            console.error("CODEX.JS: Error parsing user data:", e.message);
            displayCriticalError(`Gagal memproses data pengguna. ${e.message}. Silakan coba login ulang.`);
            // Tidak redirect otomatis agar error terlihat
            return; // Hentikan eksekusi
        }
    } else {
        console.log("CODEX.JS: Not logged in. Redirecting to login.html.");
        displayCriticalError("Anda belum login atau sesi tidak ditemukan. Mengarahkan ke halaman login...");
        setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        return; // Hentikan eksekusi
    }

    // --- INISIALISASI ELEMEN DOM ---
    const codexInput = document.getElementById('codexInput');
    const sendCodexButton = document.getElementById('sendCodexButton');
    const codexChatHistory = document.getElementById('codexChatHistory');
    const codexThinkingIndicator = document.getElementById('codexThinkingIndicator');
    const codexSidebarIcon = document.getElementById('codexSidebarIcon');
    const codexSidebar = document.getElementById('codexSidebar');
    const codexSidebarOverlay = document.getElementById('codexSidebarOverlay');
    const closeCodexPageIcon = document.getElementById('closeCodexPageIcon');
    const codexMain = document.querySelector('.codex-main');
    const codexInputWrapper = document.querySelector('.codex-input-wrapper');

    if (!codexInput || !sendCodexButton || !codexChatHistory || !codexThinkingIndicator || !codexMain || !codexInputWrapper) {
        displayCriticalError("Satu atau lebih elemen penting halaman tidak ditemukan. Halaman tidak dapat dimuat dengan benar.");
        return;
    }
    console.log("CODEX.JS: All essential DOM elements found.");

    // --- TAMPILKAN INFO MODEL AWAL SESUAI GAMBAR ---
    function addInitialAiInfo() {
        const introMessageElement = document.createElement('div');
        introMessageElement.classList.add('ai-intro-message'); // Class khusus untuk styling
        introMessageElement.innerHTML = `
            <img src="logo.png" alt="Novaria Logo" class="ai-logo">
            <span class="ai-name">Novaria</span>
            <span class="ai-model-tag">nova-coder-v3</span>
        `;
        codexChatHistory.insertBefore(introMessageElement, codexThinkingIndicator);
        codexChatHistory.scrollTop = codexChatHistory.scrollHeight;
    }
    addInitialAiInfo();


    function autoResizeTextarea() {
        codexInput.style.height = 'auto';
        let scrollHeight = codexInput.scrollHeight;
        const maxHeight = 110; // Max height textarea dari CSS
        codexInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        const inputWrapperHeight = codexInputWrapper.offsetHeight;
        codexMain.style.paddingBottom = `${inputWrapperHeight + 20}px`; // 20px margin
        if (codexChatHistory) codexChatHistory.scrollTop = codexChatHistory.scrollHeight;
    }
    codexInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea();

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, """)
             .replace(/'/g, "'");
    }

    function addCodexMessage(data, sender, isCodeBlock = false, language = 'plaintext') {
        const messageElement = document.createElement('div');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

        if (sender === 'user') {
            messageElement.textContent = data.text;
        } else { // AI
            // Header AI (logo, nama, model) TIDAK LAGI DITAMBAHKAN DI SINI per pesan
            // Karena sudah ada info model di atas chat history
            // Jika ingin per pesan, un-comment bagian header di bawah ini

            const contentContainer = document.createElement('div');
            contentContainer.classList.add('ai-message-content');

            if (isCodeBlock) {
                messageElement.classList.add('code-response');
                const codeBlockContainer = document.createElement('div');
                codeBlockContainer.classList.add('code-block-container');
                const codeToDisplay = data.code || "Kesalahan: Tidak ada kode yang diterima.";
                const langToDisplay = language || 'plaintext';

                codeBlockContainer.innerHTML = `
                    <div class="code-header-block">
                        <span class="language-tag">${escapeHtml(langToDisplay)}</span>
                        <button class="copy-code-btn" title="Salin Kode">
                            <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect height="8" width="8" x="8" y="2"/></svg>
                            <span>Salin</span>
                        </button>
                    </div>
                    <pre><code>${escapeHtml(codeToDisplay)}</code></pre>
                `;
                codeBlockContainer.querySelector('.copy-code-btn').addEventListener('click', function() {
                    copyCodeToClipboard(codeToDisplay, this);
                });
                contentContainer.appendChild(codeBlockContainer);
            } else { // Respons teks biasa dari AI (jika ada, selain kode)
                messageElement.classList.add('text-response');
                contentContainer.textContent = data.text || "Tidak ada respons teks.";
            }
            messageElement.appendChild(contentContainer);
        }
        codexChatHistory.insertBefore(messageElement, codexThinkingIndicator);
        setTimeout(() => {
          codexChatHistory.scrollTop = codexChatHistory.scrollHeight;
        }, 50);
        return messageElement;
    }

    async function handleCodexGeneration() {
        const prompt = codexInput.value.trim();
        if (!prompt) return;

        addCodexMessage({ text: prompt }, 'user');
        codexInput.value = '';
        autoResizeTextarea();

        codexThinkingIndicator.classList.remove('hidden');
        codexThinkingIndicator.style.opacity = '1';
        codexChatHistory.scrollTop = codexChatHistory.scrollHeight;

        try {
            const response = await fetch('/api/codex', { // Panggil endpoint BARU
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            const result = await response.json();
            codexThinkingIndicator.style.opacity = '0';
            setTimeout(() => codexThinkingIndicator.classList.add('hidden'), 300);

            if (response.ok && result.code) {
                // Untuk AI response yang berisi kode, kita tidak perlu header AI lagi per pesan
                addCodexMessage({ code: result.code }, 'ai', true, result.language);
            } else if (response.ok && result.message && !result.code) { // Pesan biasa dari API
                 addCodexMessage({ text: result.message }, 'ai', false);
            } else { // Error dari API
                addCodexMessage({ text: `Error: ${result.message || 'Gagal menghasilkan kode.'}` }, 'ai', false);
            }
        } catch (error) {
            console.error('CODEX.JS: Error generating code:', error);
            codexThinkingIndicator.style.opacity = '0';
            setTimeout(() => codexThinkingIndicator.classList.add('hidden'), 300);
            addCodexMessage({ text: `Error: Terjadi masalah koneksi atau respons tidak valid. Detail: ${error.message}`}, 'ai', false);
        }
    }

    sendCodexButton.addEventListener('click', handleCodexGeneration);
    codexInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleCodexGeneration();
        }
    });

    if (codexSidebarIcon && codexSidebar && codexSidebarOverlay) {
        codexSidebarIcon.addEventListener('click', () => {
            codexSidebar.classList.toggle('active');
            codexSidebarOverlay.classList.toggle('active');
        });
        codexSidebarOverlay.addEventListener('click', () => {
            codexSidebar.classList.remove('active');
            codexSidebarOverlay.classList.remove('active');
        });
    }

    if(closeCodexPageIcon) {
        closeCodexPageIcon.addEventListener('click', () => {
            window.location.href = 'login.html'; // Kembali ke halaman login
        });
    }

    // Terapkan tema dari localStorage (jika ada)
    const savedTheme = localStorage.getItem('novaria_theme') || localStorage.getItem('novaai_theme');
    if (savedTheme === 'light' || savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    console.log("CODEX.JS: Script initialized successfully and theme applied.");
});

function copyCodeToClipboard(codeText, buttonElement) {
    navigator.clipboard.writeText(codeText).then(() => {
        const originalButtonContent = buttonElement.innerHTML;
        const span = buttonElement.querySelector('span');
        if (span) span.textContent = 'Tersalin!'; else buttonElement.textContent = 'Tersalin!';
        const svg = buttonElement.querySelector('svg');
        if (svg) {
            svg.outerHTML = `<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" style="color: #66bb6a; width:13px; height:13px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        }
        setTimeout(() => { buttonElement.innerHTML = originalButtonContent; }, 2000);
    }).catch(err => { console.error('CODEX.JS: Gagal menyalin kode: ', err); alert('Gagal menyalin kode.'); });
}