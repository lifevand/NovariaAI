// code-generator.js
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser');
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
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser');
            window.location.href = 'login.html';
            return;
        }
    } else {
        window.location.href = 'login.html';
        return;
    }

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

    addCodeMessage({
        text: "Halo! Saya Novaria Code Assistant. Deskripsikan kode yang Anda butuhkan, dan saya akan coba membuatnya untuk Anda!",
        model: "nova-coder-v3"
    }, 'ai', false);


    function autoResizeTextarea() {
        codeInput.style.height = 'auto';
        let scrollHeight = codeInput.scrollHeight;
        const maxHeight = 120;
        codeInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        const inputWrapperHeight = codeInputWrapper.offsetHeight;
        codeMain.style.paddingBottom = `${inputWrapperHeight + 25}px`;
        if (codeChatHistory) codeChatHistory.scrollTop = codeChatHistory.scrollHeight;
    }
    codeInput.addEventListener('input', autoResizeTextarea);
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

    function addCodeMessage(data, sender, isCodeBlock = false, language = 'plaintext') {
        const messageElement = document.createElement('div');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

        if (sender === 'user') {
            messageElement.textContent = data.text;
        } else {
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

            if (isCodeBlock) {
                messageElement.classList.add('code-response');
                const codeBlockContainer = document.createElement('div');
                codeBlockContainer.classList.add('code-block-container');
                const codeToDisplay = data.code || "Tidak ada kode yang dihasilkan.";
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
            } else {
                messageElement.classList.add('text-response');
                contentContainer.textContent = data.text || "Tidak ada respons teks.";
            }
            messageElement.appendChild(contentContainer);
        }
        codeChatHistory.insertBefore(messageElement, codeThinkingIndicator);
        setTimeout(() => { // Beri sedikit waktu untuk render sebelum scroll
          codeChatHistory.scrollTop = codeChatHistory.scrollHeight;
        }, 50);
        return messageElement;
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
            const response = await fetch('/api/code', { // Pastikan endpoint ini benar
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            const result = await response.json();
            codeThinkingIndicator.style.opacity = '0';
            setTimeout(() => codeThinkingIndicator.classList.add('hidden'), 300);

            if (response.ok && result.code) {
                addCodeMessage({ code: result.code, model: result.modelName || "nova-coder-v3" }, 'ai', true, result.language);
            } else if (response.ok && result.message && !result.code) { // Jika ada pesan tapi bukan kode
                 addCodeMessage({ text: result.message, model: result.modelName || "nova-coder-v3" }, 'ai', false);
            }
            else { // Error dari API
                addCodeMessage({ text: `Error: ${result.message || 'Gagal menghasilkan kode.'}`, model: "nova-coder-v3" }, 'ai', false);
            }
        } catch (error) {
            console.error('Error generating code:', error);
            codeThinkingIndicator.style.opacity = '0';
            setTimeout(() => codeThinkingIndicator.classList.add('hidden'), 300);
            addCodeMessage({ text: `Error: Terjadi masalah koneksi atau respons tidak valid. Coba lagi nanti.`, model: "nova-coder-v3" }, 'ai', false);
        }
    }

    sendCodeButton.addEventListener('click', handleCodeGeneration);
    codeInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleCodeGeneration();
        }
    });

    codeSidebarIcon.addEventListener('click', () => {
        codeSidebar.classList.toggle('active');
        codeSidebarOverlay.classList.toggle('active');
    });
    codeSidebarOverlay.addEventListener('click', () => {
        codeSidebar.classList.remove('active');
        codeSidebarOverlay.classList.remove('active');
    });

    closeCodePageIcon.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    const savedTheme = localStorage.getItem('novaria_theme') || localStorage.getItem('novaai_theme');
    if (savedTheme === 'light' || savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
});

function copyCodeToClipboard(codeText, buttonElement) {
    navigator.clipboard.writeText(codeText).then(() => {
        const originalButtonContent = buttonElement.innerHTML; // Simpan seluruh konten
        const span = buttonElement.querySelector('span');
        if (span) span.textContent = 'Tersalin!';
        else buttonElement.textContent = 'Tersalin!'; // Fallback jika tidak ada span

        // Ganti ikon jika mau
        const svg = buttonElement.querySelector('svg');
        if (svg) {
            svg.outerHTML = `<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" style="color: #66bb6a; width:14px; height:14px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        }


        setTimeout(() => {
            buttonElement.innerHTML = originalButtonContent; // Kembalikan konten asli
        }, 2000);
    }).catch(err => {
        console.error('Gagal menyalin kode: ', err);
        alert('Gagal menyalin kode.');
    });
}