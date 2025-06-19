// === GANTI SELURUH ISI SCRIPT.JS ANDA DENGAN KODE INI ===

document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const menuIcon = document.getElementById('menuIcon');
    const backIcon = document.getElementById('backIcon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleLanding = document.getElementById('themeToggleLanding');
    const languageSelect = document.getElementById('languageSelect');
    const docTitle = document.querySelector('title');
    const quickCompleteContainer = document.getElementById('quickCompleteContainer');
    const chatHistory = document.getElementById('chatHistory');
    const thinkingIndicator = document.getElementById('thinkingIndicator');

    const welcomeSection = document.getElementById('welcomeSection');
    const chatSection = document.getElementById('chatSection');
    const landingThemeToggleContainer = document.getElementById('landingThemeToggleContainer');
    const mainContent = document.querySelector('main');

    let currentActivePage = 'welcome';

    const infoModalOverlay = document.getElementById('infoModalOverlay');
    const infoModalContent = document.getElementById('infoModalContent');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    const attachedFilesContainer = document.getElementById('attachedFilesContainer');
    const inputWrapper = document.querySelector('.input-wrapper');
    const MAX_FILE_SIZE_KB = 120;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;
    let attachedFiles = [];

    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition;

    // START: Konstanta untuk header AI
    const AI_SENDER_NAME = "Novaria";
    const AI_SENDER_LOGO_SRC = "/logo.png"; // Ganti dengan path logo Novaria jika beda

    // Daftar model untuk keperluan tampilan di header AI (jika modelToUse dinamis)
    // ID harus cocok dengan nilai yang mungkin ada di variabel modelToUse
    const displayableModels = [
        { id: 'gemini', name: 'Gemini (Default)' }, // Nama yang akan ditampilkan di tag
        // Tambahkan model lain di sini jika modelToUse bisa berubah
        // { id: 'gemini-pro', name: 'Gemini Pro' },
    ];
    // END: Konstanta untuk header AI


    function checkScrollable() {
        // ... (fungsi checkScrollable Anda tetap sama)
        setTimeout(() => {
            const isScrollable = chatHistory.scrollHeight > chatHistory.clientHeight;
            const isAtBottom = chatHistory.scrollHeight - chatHistory.scrollTop <= chatHistory.clientHeight + 5;
            if (isScrollable && !isAtBottom) {
                chatHistory.classList.add('has-scroll-fade');
            } else {
                chatHistory.classList.remove('has-scroll-fade');
            }
        }, 100);
    }
    chatHistory.addEventListener('scroll', checkScrollable);

    function showPage(pageName, initialMessage = null) {
        // ... (fungsi showPage Anda tetap sama, hanya bagian generateRealAIResponse yang penting)
        if (currentActivePage === pageName) return;
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
            landingThemeToggleContainer.classList.add('hidden');
            menuIcon.classList.add('hidden');
            backIcon.classList.remove('hidden');
            setTimeout(() => {
                chatHistory.scrollTop = chatHistory.scrollHeight;
                checkScrollable();
            }, 10);
            quickCompleteContainer.classList.remove('active');
        } else {
            landingThemeToggleContainer.classList.remove('hidden');
            menuIcon.classList.remove('hidden');
            backIcon.classList.add('hidden');
            if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                quickCompleteContainer.classList.add('active');
            }
        }
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, attachedFiles);
        }
        updateInputAreaPadding();
    }

    const placeholders = {
        en: ["Ask me anything...","What's on your mind?","Tell me a story...","How can I help you today?","Start a conversation...","I'm ready to chat!","Let's explore together...","What do you want to learn?"],
        id: ["Tanyakan apa saja...","Apa yang ada di pikiranmu?","Ceritakan sebuah kisah...","Bagaimana saya bisa membantumu hari ini?","Mulai percakapan...","Saya siap mengobrol!","Mari jelajahi bersama...","Apa yang ingin kamu pelajari?"]
    };
    let currentPlaceholderIndex = 0;
    let currentLanguage = localStorage.getItem('novaai_language') || 'en';
    function animatePlaceholder() {
        // ... (fungsi animatePlaceholder Anda tetap sama)
        if (messageInput.value.trim() !== '') return;
        messageInput.style.opacity = '0';
        messageInput.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            const activePlaceholders = placeholders[currentLanguage];
            currentPlaceholderIndex = (currentPlaceholderIndex + 1) % activePlaceholders.length;
            messageInput.placeholder = activePlaceholders[currentPlaceholderIndex];
            messageInput.style.opacity = '1';
            messageInput.style.transform = 'translateY(0)';
        }, 500);
    }
    let placeholderInterval = setInterval(animatePlaceholder, 3000);
    animatePlaceholder();
    messageInput.addEventListener('focus', () => {
        clearInterval(placeholderInterval);
        quickCompleteContainer.classList.remove('active');
    });
    messageInput.addEventListener('blur', () => {
        // ... (fungsi blur Anda tetap sama)
        if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
            placeholderInterval = setInterval(animatePlaceholder, 3000);
            if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            }
        }
    });
    messageInput.addEventListener('input', () => {
        // ... (fungsi input Anda tetap sama)
        if (messageInput.value.trim() !== '' || attachedFiles.length > 0) {
            quickCompleteContainer.classList.remove('active');
        } else {
            if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            }
        }
        autoResizeTextarea();
    });

    function autoResizeTextarea() {
        // ... (fungsi autoResizeTextarea Anda tetap sama)
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 120; 
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        const inputWrapperPadding = 10 * 2; 
        const newWrapperHeight = Math.min(scrollHeight, maxHeight) + inputWrapperPadding;
        inputWrapper.style.height = `${Math.min(newWrapperHeight, 160)}px`; 
        updateInputAreaPadding();
    }
    messageInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea(); 

    // MODIFIKASI: Tambahkan parameter modelUsed
    function addChatMessage(content, sender = 'user', modelUsed = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'ai') {
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');

            const logoImg = document.createElement('img');
            logoImg.src = AI_SENDER_LOGO_SRC; // Gunakan path logo Novaria
            logoImg.alt = `${AI_SENDER_NAME} Logo`;
            logoImg.classList.add('ai-header-logo');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('ai-header-name');
            nameSpan.textContent = AI_SENDER_NAME;

            const modelTagSpan = document.createElement('span');
            modelTagSpan.classList.add('ai-header-model-tag');
            modelTagSpan.textContent = modelUsed || 'N/A'; // Tampilkan model atau N/A

            aiHeader.appendChild(logoImg);
            aiHeader.appendChild(nameSpan);
            aiHeader.appendChild(modelTagSpan);
            messageElement.appendChild(aiHeader);
        }

        // Buat elemen untuk konten pesan sebenarnya (teks, code block, dll)
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content-wrapper'); // Tambahkan class jika perlu styling khusus

        if (sender === 'user') {
            contentWrapper.textContent = content;
        } else {
            contentWrapper.innerHTML = content; // Konten AI bisa berupa HTML
        }
        messageElement.appendChild(contentWrapper);

        chatHistory.insertBefore(messageElement, thinkingIndicator);

        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10); 

        setTimeout(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable(); 
        }, 50); 

        return messageElement;
    }


    function addAiMessageActions(aiMessageElement) {
        // ... (fungsi addAiMessageActions Anda tetap sama)
        // Pastikan ini ditambahkan ke elemen pesan AI utama, bukan hanya ke contentWrapper
        if (aiMessageElement.querySelector('.ai-message-actions')) return;
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');
        const getResponseText = (messageEl) => { 
            // Ambil teks dari .message-content-wrapper
            const contentWrapper = messageEl.querySelector('.message-content-wrapper');
            if (!contentWrapper) return '';
            return Array.from(contentWrapper.childNodes).filter(node => node.nodeName === "SPAN" || node.nodeType === 3).map(node => node.textContent).join('').trim(); 
        };
        const getFullContent = (messageEl) => { 
            const contentWrapper = messageEl.querySelector('.message-content-wrapper');
            if (!contentWrapper) return '';
            let fullContent = getResponseText(messageEl); 
            contentWrapper.querySelectorAll('.code-block').forEach(codeBlock => { 
                const lang = codeBlock.querySelector('.language-tag').textContent.toLowerCase(); 
                const code = codeBlock.querySelector('pre').textContent; 
                fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``; 
            }); 
            return fullContent; 
        };
        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, messageEl) => { const fullContent = getFullContent(messageEl); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, messageEl) => { const textToSpeak = getResponseText(messageEl); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, messageEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const lastUserMessage = Array.from(chatHistory.querySelectorAll('.user-message')).pop(); if (lastUserMessage) { messageEl.remove(); generateRealAIResponse(lastUserMessage.textContent, attachedFiles); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, messageEl) => { const fullContent = getFullContent(messageEl); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        
        // Tambahkan actionsContainer ke messageElement (elemen pesan AI utama)
        aiMessageElement.appendChild(actionsContainer);
        setTimeout(() => { chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
    }


    async function generateRealAIResponse(userMessage, files = []) {
        thinkingIndicator.classList.remove('hidden');
        thinkingIndicator.style.opacity = '1';
        setTimeout(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable();
        }, 0);

        try {
            // Model di-hardcode di sini sesuai script.js Anda
            const modelToUse = "gemini"; 
            const payload = { userMessage, model: modelToUse };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();
            const responseText = data.text;

            thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                thinkingIndicator.classList.add('hidden');

                let finalHtmlContent = '';
                // ... (logika parsing codeBlock Anda tetap sama)
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let lastIndex = 0;

                responseText.replace(codeBlockRegex, (match, language, code, offset) => {
                    const plainText = responseText.substring(lastIndex, offset);
                    const sanitizedText = plainText.replace(/</g, "<").replace(/>/g, ">");
                    finalHtmlContent += `<span>${sanitizedText}</span>`;

                    const lang = language || 'text';
                    const sanitizedCode = code.trim().replace(/</g, "<").replace(/>/g, ">");
                    const codeHtml = `
                        <div class="code-block">
                            <div class="code-header">
                                <span class="language-tag">${lang}</span>
                                <button class="copy-code-btn" title="Copy code" onclick="copyCode(this)">
                                    <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect height="8" width="8" x="8" y="2"/></svg>
                                    <span>Copy</span>
                                </button>
                            </div>
                            <pre>${sanitizedCode}</pre>
                        </div>`;
                    finalHtmlContent += codeHtml;
                    lastIndex = offset + match.length;
                });
                const remainingText = responseText.substring(lastIndex);
                if (remainingText) {
                    const sanitizedRemainingText = remainingText.replace(/</g, "<").replace(/>/g, ">");
                    finalHtmlContent += `<span>${sanitizedRemainingText}</span>`;
                }
                // --- END Logika Parsing ---

                // Dapatkan nama model yang akan ditampilkan di header
                const modelInfo = displayableModels.find(m => m.id === modelToUse);
                const modelDisplayNameForHeader = modelInfo ? modelInfo.name : modelToUse;

                const aiMessageElement = addChatMessage(finalHtmlContent, 'ai', modelDisplayNameForHeader);
                addAiMessageActions(aiMessageElement); // Tambahkan tombol aksi ke elemen pesan utama
                clearAttachedFiles();
                checkScrollable();
            }, 300);

        } catch (error) {
            console.error('Error fetching from /api/generate:', error);
            thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                thinkingIndicator.classList.add('hidden');
                const errorMessage = `<span>Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.</span>`;
                // Untuk pesan error AI, kita mungkin tidak perlu menampilkan nama model spesifik
                addChatMessage(errorMessage, 'ai', 'Error'); 
                clearAttachedFiles();
            }, 300);
        }
    }

    sendButton.addEventListener('click', () => {
        // ... (fungsi sendButton Anda tetap sama)
        const message = messageInput.value.trim();
        if (message !== '' || attachedFiles.length > 0) {
            let finalPrompt = message;
            if (attachedFiles.length > 0 && message === '') {
                const fileNames = attachedFiles.map(f => f.name).join(', ');
                finalPrompt = `Harap menganalisis file-file ini: ${fileNames}`;
            } else if (attachedFiles.length > 0) {
                const fileNames = attachedFiles.map(f => f.name).join(', ');
                finalPrompt = `${message} (Dilampirkan: ${fileNames})`;
            }

            if (currentActivePage === 'welcome') {
                showPage('chat', finalPrompt);
            } else {
                addChatMessage(message || finalPrompt, 'user');
                generateRealAIResponse(message || finalPrompt, attachedFiles);
            }
            messageInput.value = '';
            autoResizeTextarea();
            if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            } else {
                quickCompleteContainer.classList.remove('active');
            }
        }
    });
    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

    const initialChatMessageFromStorage = localStorage.getItem('initialChatMessage');
    if (initialChatMessageFromStorage) {
        localStorage.removeItem('initialChatMessage');
        showPage('chat', initialChatMessageFromStorage);
    } else {
        showPage('welcome');
    }

    menuIcon.addEventListener('click', () => { sidebar.classList.add('active'); sidebarOverlay.classList.add('active'); });
    sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); });
    backIcon.addEventListener('click', () => {
        // ... (fungsi backIcon Anda tetap sama)
        showPage('welcome');
        chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`;
        messageInput.value = '';
        autoResizeTextarea();
        clearAttachedFiles();
        updateInputAreaPadding();
        if (currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    });

    const savedTheme = localStorage.getItem('novaai_theme');
    if (savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
        themeToggle.checked = true;
        themeToggleLanding.checked = true;
    } else {
        document.body.classList.remove('light-mode');
        themeToggle.checked = false;
        themeToggleLanding.checked = false;
    }
    function applyTheme(isLightMode) { 
        // ... (fungsi applyTheme Anda tetap sama)
        if (isLightMode) { document.body.classList.add('light-mode'); localStorage.setItem('novaai_theme', 'light-mode'); } else { document.body.classList.remove('light-mode'); localStorage.setItem('novaai_theme', 'dark-mode'); } themeToggle.checked = isLightMode; themeToggleLanding.checked = isLightMode; 
    }
    themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));
    themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));

    const translations = {
        en: {
            documentTitle: "NovaAI", welcomeTitle: "Welcome", helpText: "Hii, I Can Help You?", languageOption: "Language", themeMode: "Dark / Light Mode", privacyPolicy: "Privacy Policy", termsAndConditions: "Terms & Conditions", policy: "Policy", aboutUs: "About Us", settingsTitle: "Settings",
            quickSuggestions: ["What's the weather like today?", "Tell me a fun fact about space.", "Explain AI in simple terms.", "Give me a recipe for cookies."],
            privacyPolicyContent: `<h3>Privacy Policy</h3><p>Your privacy is important to us...</p>`, // Content truncated for brevity
            termsAndConditionsContent: `<h3>Terms & Conditions</h3><p>Welcome to NovaAI...</p>`,
            policyContent: `<h3>Policy</h3><p>This document outlines the general policies...</p>`,
            aboutUsContent: `<h3>About Us</h3><p>NovaAI is an innovative AI assistant...</p>`
        },
        id: {
            documentTitle: "NovaAI", welcomeTitle: "Selamat Datang", helpText: "Hai, Ada yang Bisa Saya Bantu?", languageOption: "Bahasa", themeMode: "Mode Gelap / Terang", privacyPolicy: "Kebijakan Privasi", termsAndConditions: "Syarat & Ketentuan", policy: "Kebijakan", aboutUs: "Tentang Kami", settingsTitle: "Pengaturan",
            quickSuggestions: ["Bagaimana cuaca hari ini?", "Ceritakan fakta menarik tentang luar angkasa.", "Jelaskan AI dalam istilah sederhana.", "Berikan saya resep kue kering."],
            privacyPolicyContent: `<h3>Kebijakan Privasi</h3><p>Privasi Anda penting bagi kami...</p>`, // Content truncated
            termsAndConditionsContent: `<h3>Syarat & Ketentuan</h3><p>Selamat datang di NovaAI...</p>`,
            policyContent: `<h3>Kebijakan</h3><p>Dokumen ini menguraikan kebijakan umum...</p>`,
            aboutUsContent: `<h3>Tentang Kami</h3><p>NovaAI adalah asisten AI inovatif...</p>`
        }
    }; // Truncated translations for brevity, use your full content
    function updateTextContent(lang) {
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.dataset.key;
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
        if (translations[lang] && translations[lang].documentTitle) {
            docTitle.textContent = translations[lang].documentTitle;
        }
        updateQuickSuggestions(lang);
    }
    function updateQuickSuggestions(lang) {
        quickCompleteContainer.innerHTML = '';
        const suggestions = translations[lang].quickSuggestions;
        suggestions.forEach(suggestionText => {
            const button = document.createElement('button');
            button.classList.add('quick-complete-btn');
            button.textContent = suggestionText;
            button.addEventListener('click', () => {
                if (currentActivePage === 'welcome') {
                    showPage('chat', suggestionText);
                } else {
                    addChatMessage(suggestionText, 'user');
                    generateRealAIResponse(suggestionText); 
                }
                messageInput.value = '';
                autoResizeTextarea();
                messageInput.focus();
                clearInterval(placeholderInterval);
                quickCompleteContainer.classList.remove('active');
            });
            quickCompleteContainer.appendChild(button);
        });
        if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    }
    languageSelect.value = currentLanguage;
    updateTextContent(currentLanguage);
    languageSelect.addEventListener('change', (event) => { currentLanguage = event.target.value; localStorage.setItem('novaai_language', currentLanguage); updateTextContent(currentLanguage); animatePlaceholder(); if (recognition) { recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; } });

    function openModal(titleKey, contentKey) { modalTitle.textContent = translations[currentLanguage][titleKey]; modalBody.innerHTML = translations[currentLanguage][contentKey]; infoModalOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeModal() { infoModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
    modalCloseBtn.addEventListener('click', closeModal);
    infoModalOverlay.addEventListener('click', (e) => { if (e.target === infoModalOverlay) { closeModal(); } });
    document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(item => { item.addEventListener('click', function (e) { e.preventDefault(); sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); const targetKey = this.dataset.modalTarget; const titleKey = targetKey; const contentKey = targetKey + 'Content'; openModal(titleKey, contentKey); }); });

    function setupRippleEffects() {
        const clickableElements = document.querySelectorAll(
            '.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .current-model-toggle, .model-option-btn' // Added model selector buttons
        ); 
        clickableElements.forEach(element => {
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }
            const newHandler = function (e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                this.appendChild(ripple);
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - (size / 2);
                const y = e.clientY - rect.top - (size / 2);
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.addEventListener('animationend', () => {
                    ripple.remove();
                });
            };
            element.addEventListener('click', newHandler);
            element._rippleHandler = newHandler;
        });
    }
    setupRippleEffects();
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                let needsRippleSetup = false;
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { 
                        if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn') || node.matches('.model-option-btn'))) { // Added .model-option-btn
                            needsRippleSetup = true;
                        } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn') || node.querySelector('.model-option-btn'))) { // Added .model-option-btn
                            needsRippleSetup = true;
                        }
                    }
                });
                if (needsRippleSetup) {
                    setupRippleEffects();
                }
            }
        });
    });
    observer.observe(chatHistory, { childList: true, subtree: true });
    observer.observe(quickCompleteContainer, { childList: true, subtree: true }); 
    observer.observe(modelOptionsList, { childList: true, subtree: true }); // Observe model options list

    // START: Model Selector Functions
    function updateCurrentModelDisplay() {
        const model = availableModels.find(m => m.id === selectedModelId);
        if (model) {
            currentModelLogo.src = model.logo;
            currentModelName.textContent = model.name;
        }
        // Update selected state in options list
        const optionButtons = modelOptionsList.querySelectorAll('.model-option-btn');
        optionButtons.forEach(btn => {
            if (btn.dataset.modelId === selectedModelId) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    function populateModelOptions() {
        modelOptionsList.innerHTML = ''; // Clear existing options
        availableModels.forEach(model => {
            const button = document.createElement('button');
            button.classList.add('model-option-btn');
            button.dataset.modelId = model.id;

            const logoImg = document.createElement('img');
            logoImg.src = model.logo;
            logoImg.alt = 'model logo';
            logoImg.classList.add('model-logo');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = model.name;

            button.appendChild(logoImg);
            button.appendChild(nameSpan);

            button.addEventListener('click', () => {
                selectedModelId = model.id;
                localStorage.setItem('novaai_selectedModel', selectedModelId);
                updateCurrentModelDisplay();
                toggleModelSelector(); // Close after selection
            });
            modelOptionsList.appendChild(button);
        });
        updateCurrentModelDisplay(); // To set initial 'selected' class
        setupRippleEffects(); // Apply ripple to newly created buttons
    }

    function toggleModelSelector() {
        isModelSelectorOpen = !isModelSelectorOpen;
        if (isModelSelectorOpen) {
            modelOptionsList.classList.add('active');
            modelToggleArrow.classList.add('open'); // Points down
        } else {
            modelOptionsList.classList.remove('active');
            modelToggleArrow.classList.remove('open'); // Points up
        }
    }

    function initializeModelSelector() {
        populateModelOptions();
        updateCurrentModelDisplay();
        currentModelToggle.addEventListener('click', toggleModelSelector);
         // Ensure arrow is initially pointing up (options closed)
        if (!isModelSelectorOpen) {
            modelToggleArrow.classList.remove('open');
        } else {
             modelToggleArrow.classList.add('open');
        }
    }
    function updateInputAreaPadding() {
        const inputWrapperHeight = inputWrapper.offsetHeight;
        const attachedFilesHeight = attachedFilesContainer.offsetHeight;
        const attachedFilesIsVisible = attachedFilesContainer.children.length > 0;
        const fileContainerActualHeight = attachedFilesIsVisible ? attachedFilesHeight + 10 : 0; 
        const totalBottomSpace = inputWrapperHeight + 15 + fileContainerActualHeight; 
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; 
        chatHistory.scrollTop = chatHistory.scrollHeight; 
    }

    plusButton.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`File "${file.name}" (${(file.size / 1024).toFixed(2)} KB) melebihi ukuran maksimum ${MAX_FILE_SIZE_KB} KB.`);
                } else {
                    const isDuplicate = attachedFiles.some(f => f.name === file.name && f.size === file.size);
                    if (!isDuplicate) {
                        attachedFiles.push(file);
                        displayAttachedFile(file);
                    } else {
                        alert(`File "${file.name}" sudah dilampirkan.`);
                    }
                }
            });
            fileInput.value = ''; 
            quickCompleteContainer.classList.remove('active');
            updateInputAreaPadding();
        }
     });  
    function displayAttachedFile(file) {
        const fileItem = document.createElement('div');
        fileItem.classList.add('attached-file-item');
        fileItem.dataset.fileName = file.name;
        fileItem.dataset.fileSize = file.size; 
        const fileInfo = document.createElement('div');
        fileInfo.classList.add('file-info');
        fileInfo.innerHTML = `<span class="file-name">${file.name}</span><span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>`;
        fileItem.appendChild(fileInfo);
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-file-btn');
        removeButton.innerHTML = '×';
        removeButton.title = `Hapus ${file.name}`;
        removeButton.addEventListener('click', () => {
            removeAttachedFile(file.name, file.size);
        });
        fileItem.appendChild(removeButton);
        attachedFilesContainer.appendChild(fileItem);
        attachedFilesContainer.style.display = 'flex';
        updateInputAreaPadding();
    }
    function removeAttachedFile(fileName, fileSize) {
        attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSize));
        const fileItemToRemove = document.querySelector(`.attached-file-item[data-file-name="${fileName}"][data-file-size="${fileSize}"]`);
        if (fileItemToRemove) {
            fileItemToRemove.remove();
        }
        if (attachedFiles.length === 0) {
            attachedFilesContainer.style.display = 'none'; 
            if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            }
        }
        updateInputAreaPadding();
    }
    function clearAttachedFiles() {
        attachedFiles = [];
        attachedFilesContainer.innerHTML = '';
        attachedFilesContainer.style.display = 'none'; 
        updateInputAreaPadding();
        if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    }

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';
        recognition.onstart = () => {
            console.log('Voice recognition started.');
            voiceInputButton.style.backgroundColor = 'red';
            messageInput.placeholder = currentLanguage === 'id' ? 'Mendengarkan...' : 'Listening...';
        };
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            messageInput.value = finalTranscript + interimTranscript;
            autoResizeTextarea();
        };
        recognition.onend = () => {
            console.log('Voice recognition ended.');
            voiceInputButton.style.backgroundColor = ''; 
            if (finalTranscript.trim() !== '') {
                messageInput.value = finalTranscript.trim();
            }
            if (messageInput.value.trim() === '') {
                 messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex];
            }
            finalTranscript = ''; 
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceInputButton.style.backgroundColor = ''; 
            messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex]; 
            finalTranscript = '';
            alert('Speech recognition error: ' + event.error);
        };
        voiceInputButton.addEventListener('click', () => {
            try {
                if (recognition && typeof recognition.stop === 'function' && recognition.recording) { 
                    recognition.stop();
                } else {
                    recognition.start();
                }
            } catch (e) {
                console.warn('Recognition error or already started/stopped:', e);
                 if (recognition && typeof recognition.stop === 'function') recognition.stop();
            }
        });
    } else {
        voiceInputButton.style.display = 'none'; 
        console.warn('Web Speech API not supported in this browser.');
    }
    
    // START: INTRO ANIMATION LOGIC
    const introOverlay = document.getElementById('introOverlay');
    if (introOverlay) {
        // Sembunyikan overlay setelah 5 detik (2s animasi elemen + 3s loading bar)
        setTimeout(() => {
            introOverlay.classList.add('hidden-intro');
            // Hapus dari DOM setelah transisi selesai agar tidak mengganggu
            setTimeout(() => {
                if (introOverlay.parentNode) {
                    introOverlay.parentNode.removeChild(introOverlay);
                }
            }, 800); // Sesuaikan dengan durasi transisi opacity di CSS
        }, 5000); // Total 5 detik
    }
    // END: INTRO ANIMATION LOGIC

    showPage(currentActivePage); 
});

// Fungsi copyCode diletakkan di luar DOMContentLoaded agar bisa diakses oleh atribut onclick
function copyCode(buttonElement) {
    // ... (fungsi copyCode Anda tetap sama)
    const pre = buttonElement.closest('.code-block').querySelector('pre');
    navigator.clipboard.writeText(pre.textContent).then(() => {
        const span = buttonElement.querySelector('span');
        const originalText = span.textContent; 
        span.textContent = 'Copied!';
        setTimeout(() => {
            span.textContent = originalText; 
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code: ', err);
        const span = buttonElement.querySelector('span');
        span.textContent = 'Error!';
        setTimeout(() => {
            span.textContent = 'Copy';
        }, 2000);
    });
}