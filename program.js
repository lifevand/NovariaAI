// program.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Program.js: DOM Content Loaded"); // LOG AWAL

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser'); // Ganti 'novaUser' jika key Anda berbeda
    let currentUser = null;

    if (isLoggedIn === 'true' && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (!currentUser || !currentUser.name) {
                console.error("Program.js: Invalid user data in localStorage.");
                throw new Error("Invalid user data in storage.");
            }
            console.log("Program.js: User authenticated, proceeding.");
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded');
        } catch (e) {
            console.error("Program.js: Error parsing user data or invalid data:", e);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser'); // Ganti 'novaUser' jika key Anda berbeda
            window.location.href = 'login.html';
            return;
        }
    } else {
        console.log("Program.js: Not logged in or no stored user, redirecting to login.html");
        window.location.href = 'login.html';
        return;
    }

    const programInput = document.getElementById('programInput');
    const sendProgramButton = document.getElementById('sendProgramButton');
    const programChatHistory = document.getElementById('programChatHistory');
    const programThinkingIndicator = document.getElementById('programThinkingIndicator');
    const programSidebarIcon = document.getElementById('programSidebarIcon');
    const programSidebar = document.getElementById('programSidebar');
    const programSidebarOverlay = document.getElementById('programSidebarOverlay');
    const closeProgramPageIcon = document.getElementById('closeProgramPageIcon');
    const programMain = document.querySelector('.program-main');
    const programInputWrapper = document.querySelector('.program-input-wrapper');

    if (!programInput || !sendProgramButton || !programChatHistory || !programThinkingIndicator) {
        console.error("Program.js: One or more essential DOM elements are missing!");
        addProgramMessage({ text: "Error: Gagal memuat komponen halaman. Silakan coba muat ulang.", model: "System" }, 'ai', false);
        return;
    }

    addProgramMessage({
        text: "Halo! Saya Novaria Program Assistant. Deskripsikan program atau skrip yang Anda butuhkan, dan saya akan coba membuatnya untuk Anda!",
        model: "nova-program-v3" // Nama model baru
    }, 'ai', false);


    function autoResizeTextarea() {
        if (!programInput || !programInputWrapper || !programMain) return;
        programInput.style.height = 'auto';
        let scrollHeight = programInput.scrollHeight;
        const maxHeight = 120;
        programInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        const inputWrapperHeight = programInputWrapper.offsetHeight;
        programMain.style.paddingBottom = `${inputWrapperHeight + 25}px`;
        if (programChatHistory) programChatHistory.scrollTop = programChatHistory.scrollHeight;
    }
    programInput.addEventListener('input', autoResizeTextarea);
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

    function addProgramMessage(data, sender, isCodeBlock = false, language = 'plaintext') {
        if (!programChatHistory || !programThinkingIndicator) return;

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
                <span class="ai-model-tag">${data.model || "nova-program-v3"}</span>
            `;
            messageElement.appendChild(aiHeader);

            const contentContainer = document.createElement('div');
            contentContainer.classList.add('ai-message-content');

            if (isCodeBlock) {
                messageElement.classList.add('code-response'); // Class untuk AI message dengan code
                const codeBlockContainer = document.createElement('div');
                codeBlockContainer.classList.add('code-block-container');
                const codeToDisplay = data.code || "Error: Tidak ada kode yang diterima.";
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
                messageElement.classList.add('text-response'); // Class untuk AI message teks biasa
                contentContainer.textContent = data.text || "Tidak ada respons.";
            }
            messageElement.appendChild(contentContainer);
        }
        programChatHistory.insertBefore(messageElement, programThinkingIndicator);
        setTimeout(() => {
          programChatHistory.scrollTop = programChatHistory.scrollHeight;
        }, 50);
        return messageElement;
    }


    async function handleProgramGeneration() {
        if (!programInput || !programThinkingIndicator) return;
        const prompt = programInput.value.trim();
        if (!prompt) return;

        addProgramMessage({ text: prompt }, 'user');
        programInput.value = '';
        autoResizeTextarea();

        programThinkingIndicator.classList.remove('hidden');
        programThinkingIndicator.style.opacity = '1';
        programChatHistory.scrollTop = programChatHistory.scrollHeight;

        try {
            const response = await fetch('/api/program', { // Panggil endpoint BARU /api/program
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            const result = await response.json();
            programThinkingIndicator.style.opacity = '0';
            setTimeout(() => programThinkingIndicator.classList.add('hidden'), 300);

            if (response.ok && result.code) {
                addProgramMessage({ code: result.code, model: result.modelName || "nova-program-v3" }, 'ai', true, result.language);
            } else if (response.ok && result.message && !result.code) {
                 addProgramMessage({ text: result.message, model: result.modelName || "nova-program-v3" }, 'ai', false);
            } else {
                addProgramMessage({ text: `Error: ${result.message || 'Gagal menghasilkan program.'}`, model: "nova-program-v3" }, 'ai', false);
            }
        } catch (error) {
            console.error('Program.js: Error generating program:', error);
            programThinkingIndicator.style.opacity = '0';
            setTimeout(() => programThinkingIndicator.classList.add('hidden'), 300);
            addProgramMessage({ text: `Error: Terjadi masalah koneksi atau respons tidak valid. Coba lagi nanti. Detail: ${error.message}`, model: "nova-program-v3" }, 'ai', false);
        }
    }

    sendProgramButton.addEventListener('click', handleProgramGeneration);
    programInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleProgramGeneration();
        }
    });

    if (programSidebarIcon && programSidebar && programSidebarOverlay) {
        programSidebarIcon.addEventListener('click', () => {
            programSidebar.classList.toggle('active');
            programSidebarOverlay.classList.toggle('active');
        });
        programSidebarOverlay.addEventListener('click', () => {
            programSidebar.classList.remove('active');
            programSidebarOverlay.classList.remove('active');
        });
    }

    if(closeProgramPageIcon) {
        closeProgramPageIcon.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    const savedTheme = localStorage.getItem('novaria_theme') || localStorage.getItem('novaai_theme');
    if (savedTheme === 'light' || savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    console.log("Program.js: Script initialized successfully.");
});

function copyCodeToClipboard(codeText, buttonElement) {
    navigator.clipboard.writeText(codeText).then(() => {
        const originalButtonContent = buttonElement.innerHTML;
        const span = buttonElement.querySelector('span');
        if (span) span.textContent = 'Tersalin!';
        else buttonElement.textContent = 'Tersalin!';

        const svg = buttonElement.querySelector('svg');
        if (svg) {
            svg.outerHTML = `<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" style="color: #66bb6a; width:14px; height:14px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        }
        setTimeout(() => {
            buttonElement.innerHTML = originalButtonContent;
        }, 2000);
    }).catch(err => {
        console.error('Program.js: Gagal menyalin kode: ', err);
        alert('Gagal menyalin kode.');
    });
                          }
