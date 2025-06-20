// code.js
document.addEventListener('DOMContentLoaded', () => {
    // --- PENGECEKAN LOGIN (sama seperti di index.html/script.js) ---
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser'); // Ganti dengan key user Anda jika beda
    let currentUser = null;

    if (isLoggedIn === 'true' && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (!currentUser || !currentUser.name) {
                throw new Error("Invalid user data in storage.");
            }
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded');
        } catch (e) {
            console.error("Error parsing user data or invalid data:", e);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser'); // Ganti dengan key user Anda jika beda
            window.location.href = 'login.html';
            return;
        }
    } else {
        window.location.href = 'login.html';
        return;
    }
    // --- AKHIR PENGECEKAN LOGIN ---

    const codeInput = document.getElementById('codeInput');
    const sendCodeButton = document.getElementById('sendCodeButton');
    const codeChatHistory = document.getElementById('codeChatHistory');
    const codeThinkingIndicator = document.getElementById('codeThinkingIndicator');
    const codeSidebarIcon = document.getElementById('codeSidebarIcon');
    const codeSidebar = document.getElementById('codeSidebar');
    const codeSidebarOverlay = document.getElementById('codeSidebarOverlay');
    const closeCodePageIcon = document.getElementById('closeCodePageIcon');
    const codeMain = document.querySelector('.code-main');
    const codeInputWrapper = document.querySelector('.code-input-wrapper');

    // Tampilkan pesan AI pertama (identitas)
    addCodeMessage({
        text: "Halo! Saya Novaria Code Assistant. Apa yang bisa saya bantu buat hari ini?",
        model: "nova-coder-v3" // Nama model sesuai gambar Anda
    }, 'ai');


    function autoResizeTextarea() {
        codeInput.style.height = 'auto';
        let scrollHeight = codeInput.scrollHeight;
        const maxHeight = 120; // Max height textarea
        codeInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';

        // Sesuaikan padding-bottom main content
        const inputWrapperHeight = codeInputWrapper.offsetHeight;
        codeMain.style.paddingBottom = `${inputWrapperHeight + 20}px`; // 20px margin tambahan
        if (codeChatHistory) codeChatHistory.scrollTop = codeChatHistory.scrollHeight;
    }
    codeInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea(); // Panggil sekali untuk inisialisasi

    function addCodeMessage(data, sender, isCode = false, language = 'plaintext') {
        const messageElement = document.createElement('div');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

        if (sender === 'user') {
            messageElement.textContent = data.text; // Jika 'data' adalah objek dengan properti 'text'
        } else { // AI
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');
            aiHeader.innerHTML = `
                <img src="logo.png" alt="Novaria Logo" class="ai-logo">
                <span class="ai-name">Novaria</span>
                <span class="ai-model-tag">${data.model || "nova-coder-v3"}</span>
            `;
            messageElement.appendChild(aiHeader);

            const contentContainer = document.createElement('div');
            contentContainer.classList.add('ai-message-content');

            if (isCode) {
                messageElement.classList.add('code-response'); // Tambah class spesifik jika ini adalah respons kode
                const codeBlockContainer = document.createElement('div');
                codeBlockContainer.classList.add('code-block-container');
                codeBlockContainer.innerHTML = `
                    <div class="code-header-block">
                        <span class="language-tag">${language || 'plaintext'}</span>
                        <button class="copy-code-btn" title="Salin Kode">
                            <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect height="8" width="8" x="8" y="2"/></svg>
                            <span>Salin</span>
                        </button>
                    </div>
                    <pre><code>${escapeHtml(data.code)}</code></pre>
                `;
                codeBlockContainer.querySelector('.copy-code-btn').addEventListener('click', function() {
                    copyCodeToClipboard(data.code, this);
                });
                contentContainer.appendChild(codeBlockContainer);
            } else {
                messageElement.classList.add('text-response');
                contentContainer.textContent = data.text;
            }
            messageElement.appendChild(contentContainer);
        }
        codeChatHistory.insertBefore(messageElement, codeThinkingIndicator);
        codeChatHistory.scrollTop = codeChatHistory.scrollHeight;
        return messageElement;
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, """)
             .replace(/'/g, "'");
    }

    async function handleCodeGeneration() {
        const prompt = codeInput.value.trim();
        if (!prompt) return;

        addCodeMessage({ text: prompt }, 'user');
        codeInput.value = '';
        autoResizeTextarea();

        codeThinkingIndicator.classList.remove('hidden');
        codeThinkingIndicator.style.opacity = '1';
        codeChatHistory.scrollTop = codeChatHistory.scrollHeight;

        try {
            const response = await fetch('/api/code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            const result = await response.json();
            codeThinkingIndicator.style.opacity = '0';
            setTimeout(() => codeThinkingIndicator.classList.add('hidden'), 300);

            if (response.ok) {
                addCodeMessage({ code: result.code, model: result.modelName || "nova-coder-v3" }, 'ai', true, result.language || 'javascript');
            } else {
                addCodeMessage({ text: `Error: ${result.message || 'Gagal menghasilkan kode.'}`, model: "nova-coder-v3" }, 'ai');
            }
        } catch (error) {
            console.error('Error generating code:', error);
            codeThinkingIndicator.style.opacity = '0';
            setTimeout(() => codeThinkingIndicator.classList.add('hidden'), 300);
            addCodeMessage({ text: `Error: Terjadi masalah koneksi. Coba lagi nanti.`, model: "nova-coder-v3" }, 'ai');
        }
    }

    sendCodeButton.addEventListener('click', handleCodeGeneration);
    codeInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleCodeGeneration();
        }
    });

    // Sidebar (kosong)
    codeSidebarIcon.addEventListener('click', () => {
        codeSidebar.classList.toggle('active');
        codeSidebarOverlay.classList.toggle('active');
    });
    codeSidebarOverlay.addEventListener('click', () => {
        codeSidebar.classList.remove('active');
        codeSidebarOverlay.classList.remove('active');
    });

    // Tombol X (keluar)
    closeCodePageIcon.addEventListener('click', () => {
        window.location.href = 'login.html'; // Kembali ke halaman login
    });

    // --- Fungsi Tema Global (Jika style.css utama dimuat dan ada body.light-mode) ---
    // Cek tema dari localStorage yang mungkin diset oleh halaman lain
    const savedTheme = localStorage.getItem('novaria_theme') || localStorage.getItem('novaai_theme'); // Cek kedua key
    if (savedTheme === 'light' || savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    // Tidak ada toggle tema di halaman ini, hanya menerapkan.
});

function copyCodeToClipboard(codeText, buttonElement) {
    navigator.clipboard.writeText(codeText).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `
            <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" style="color: #66bb6a;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Tersalin!</span>`;
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Gagal menyalin kode: ', err);
        alert('Gagal menyalin kode.');
    });
}