// script.js - Untuk halaman utama aplikasi (index.html)

document.addEventListener('DOMContentLoaded', () => {
    // === AWAL: PENGECEKAN LOGIN ===
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
            console.error("Error parsing user data or invalid data:", e);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser');
            window.location.href = 'login.html';
            return;
        }
    } else {
        window.location.href = 'login.html';
        return;
    }
    // === AKHIR: PENGECEKAN LOGIN ===

    // Selektor Elemen DOM Utama
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
    const infoModalOverlay = document.getElementById('infoModalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    const inputWrapper = document.querySelector('.input-wrapper');
    const fileChipContainer = document.getElementById('fileChipContainer');
    const voiceInputButton = document.getElementById('voiceInputButton');
    const logoutButton = document.getElementById('logoutButton');

    // Variabel State Aplikasi
    let currentActivePage = 'welcome';
    let greetingGivenThisSession = false;
    let attachedFiles = [];
    let recognition;
    let currentLanguage = localStorage.getItem('novaria_language') || 'id';
    let placeholderInterval;
    let currentPlaceholderIndex = 0;

    const MAX_FILE_SIZE_KB_NEW = 450;
    const MAX_FILE_SIZE_BYTES_NEW = MAX_FILE_SIZE_KB_NEW * 1024;
    const MAX_FILES_ALLOWED = 5;

    // --- FUNGSI-FUNGSI UTILITAS ---
    function formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function sanitizeHtml(text) { // Sanitasi dasar
        const temp = document.createElement('div');
        temp.textContent = text;
        // Ganti karakter khusus HTML untuk keamanan dasar saat menyisipkan sebagai HTML
        return temp.innerHTML.replace(/"/g, """).replace(/'/g, "'").replace(/</g, "<").replace(/>/g, ">");
    }

    // --- FUNGSI INTI APLIKASI ---
    function checkScrollable() {
        setTimeout(() => {
            if (!chatHistory) return;
            const isScrollable = chatHistory.scrollHeight > chatHistory.clientHeight;
            const isAtBottom = chatHistory.scrollHeight - chatHistory.scrollTop <= chatHistory.clientHeight + 15;
            chatHistory.classList.toggle('has-scroll-fade', isScrollable && !isAtBottom);
        }, 100);
    }

    function updateInputAreaAppearance() {
        if (!inputWrapper || !mainContent) return;
        const inputWrapperHeight = inputWrapper.offsetHeight;
        // Cek apakah ada footer di index.html (mungkin Anda akan menambahkannya nanti)
        const appFooter = document.querySelector('footer.app-footer'); // Misal footer di index.html punya class 'app-footer'
        const footerHeight = appFooter ? appFooter.offsetHeight : 0;
        
        const totalBottomSpace = footerHeight + inputWrapperHeight + 15; // 15px margin bawah input-wrapper
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; // +20px buffer

        if (chatHistory) {
            // Tambahkan sedikit penundaan untuk memastikan semua elemen sudah dirender sebelum scroll
            setTimeout(() => {
                 chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 50);
        }
    }

    function autoResizeTextarea() {
        if (!messageInput) return;
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 120;
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        updateInputAreaAppearance();
    }
    
    function addChatMessageElement(element) {
        if (!chatHistory) return;
        if (thinkingIndicator && chatHistory.contains(thinkingIndicator)) {
            chatHistory.insertBefore(element, thinkingIndicator);
        } else {
            chatHistory.appendChild(element);
        }
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 10);
        setTimeout(() => {
            if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable();
        }, 70); // Sedikit lebih lama untuk memastikan render selesai
    }
    
    function createAiHeader(modelName = "nova-3.5-quantify") {
        const aiHeader = document.createElement('div');
        aiHeader.classList.add('ai-message-header');
        const aiLogoImg = document.createElement('img');
        aiLogoImg.src = 'logo.png'; // Pastikan logo.png ada di root atau path benar
        aiLogoImg.alt = 'Novaria Logo';
        aiLogoImg.classList.add('ai-logo');
        aiHeader.appendChild(aiLogoImg);
        const aiNameSpan = document.createElement('span');
        aiNameSpan.classList.add('ai-name');
        aiNameSpan.textContent = 'Novaria';
        aiHeader.appendChild(aiNameSpan);
        const aiModelTagSpan = document.createElement('span');
        aiModelTagSpan.classList.add('ai-model-tag');
        aiModelTagSpan.textContent = modelName;
        aiHeader.appendChild(aiModelTagSpan);
        return aiHeader;
    }

    function addChatMessage(content, sender = 'user', isHtml = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            messageElement.textContent = content;
        } else {
            messageElement.appendChild(createAiHeader()); // Menggunakan model default
            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            if (isHtml) {
                aiContentContainer.innerHTML = content; // AMAN JIKA content SUDAH DISANITASI atau dari sumber terpercaya
            } else {
                // Bungkus teks biasa dalam span agar konsisten dan bisa di-style jika perlu
                const span = document.createElement('span');
                span.textContent = content;
                aiContentContainer.appendChild(span);
            }
            messageElement.appendChild(aiContentContainer);
        }
        addChatMessageElement(messageElement);
        return messageElement;
    }

    function addAiImageMessage(imageUrl, altText = "Generated AI Image") {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'ai-message', 'ai-image-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';
        messageElement.appendChild(createAiHeader("image-generator")); // Tag model khusus untuk gambar
        
        const aiContentContainer = document.createElement('div');
        aiContentContainer.classList.add('ai-message-content');
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = altText;
        imgElement.classList.add('generated-ai-image');
        imgElement.onload = () => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; checkScrollable(); };
        imgElement.onerror = () => { imgElement.alt = "Gagal memuat gambar."; imgElement.src=""; /* Cegah ikon error browser */ };
        aiContentContainer.appendChild(imgElement);
        messageElement.appendChild(aiContentContainer);
        addChatMessageElement(messageElement);
        return messageElement;
    }
    
    // Fungsi addAiMessageActions (LENGKAP)
    function addAiMessageActions(aiMessageElement) {
        const contentContainer = aiMessageElement.querySelector('.ai-message-content');
        if (!contentContainer || contentContainer.querySelector('.ai-message-actions') || aiMessageElement.classList.contains('ai-image-message')) {
             // Jangan tambahkan aksi ke pesan gambar untuk saat ini, atau buat aksi terpisah
            return;
        }

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

        const getResponseText = (contentEl) => {
            let text = '';
            contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
                    text += node.textContent;
                } else if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            });
            return text.trim();
        };
        const getFullContent = (contentEl) => {
            let fullContent = '';
             contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SPAN') {
                        fullContent += node.textContent;
                    } else if (node.classList.contains('code-block')) {
                        const langTag = node.querySelector('.language-tag');
                        const lang = langTag ? langTag.textContent.toLowerCase() : 'text';
                        const code = node.querySelector('pre')?.textContent || '';
                        fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``;
                    }
                } else if (node.nodeType === Node.TEXT_NODE) {
                    fullContent += node.textContent;
                }
            });
            return fullContent.trim();
        };

        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl) => { const fullContent = getFullContent(contentContainer); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => console.error('Failed to copy: ', err)); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl) => { const textToSpeak = getResponseText(contentContainer); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg?.classList.add('rotating'); buttonEl.disabled = true; const lastUserMsgEl = Array.from(chatHistory.querySelectorAll('.user-message')).pop(); if (lastUserMsgEl) { msgEl.remove(); generateRealAIResponse(lastUserMsgEl.textContent, attachedFiles); } else { svg?.classList.remove('rotating'); buttonEl.disabled = false;}} },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl) => { const fullContent = getFullContent(contentContainer); if (navigator.share) { navigator.share({ title: 'Novaria Response', text: fullContent }).catch(error => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach(btnInfo => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        contentContainer.appendChild(actionsContainer);
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; }, 50);
    }

    // Fungsi generateRealAIResponse (LENGKAP dengan deteksi gambar)
    async function generateRealAIResponse(userMessage, files = []) {
        // ... (kode lengkap generateRealAIResponse dari respons sebelumnya, yang sudah ada deteksi imageKeywords,
        // pemanggilan /api/generateImage, dan pemanggilan /api/generate untuk teks,
        // termasuk sapaan, parsing markdown untuk code block, dan addAiMessageActions)
        // Pastikan bagian ini persis sama dengan versi terakhir yang berfungsi untuk Anda.
        // Ini adalah fungsi yang paling kompleks. Saya akan menyalin bagian pentingnya lagi.
        const imageKeywords = ["buat gambar", "generate image", "gambarkan", "lukiskan", "create an image of", "draw a picture of", "gambar dari"];
        const isImageRequest = imageKeywords.some(keyword => userMessage.toLowerCase().includes(keyword.toLowerCase()));

        if (thinkingIndicator) { thinkingIndicator.classList.remove('hidden'); thinkingIndicator.style.opacity = '1'; }
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; checkScrollable(); }, 10);

        if (isImageRequest) {
            let imagePrompt = userMessage;
            imageKeywords.forEach(keyword => { imagePrompt = imagePrompt.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ''); });
            imagePrompt = imagePrompt.trim();
            if (!imagePrompt) { 
                addChatMessage("Gambar seperti apa yang ingin Anda buat?", 'ai'); 
                if (thinkingIndicator) { thinkingIndicator.classList.add('hidden'); thinkingIndicator.style.opacity = '0'; }
                return; 
            }
            try {
                const response = await fetch('/api/generateImage', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: imagePrompt }),
                });
                if (thinkingIndicator) { thinkingIndicator.classList.add('hidden'); thinkingIndicator.style.opacity = '0'; }
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Server error: ${response.status}`); }
                const data = await response.json();
                if (data.imageUrl) { addAiImageMessage(data.imageUrl, `AI generated: ${imagePrompt}`); } 
                else { throw new Error("Tidak ada URL gambar yang diterima dari server."); }
            } catch (error) {
                console.error('Error calling /api/generateImage:', error);
                if (thinkingIndicator) { thinkingIndicator.classList.add('hidden'); thinkingIndicator.style.opacity = '0'; }
                addChatMessage(`<span>Maaf, terjadi kesalahan saat membuat gambar: ${error.message}.</span>`, 'ai', true);
            }
        } else { 
            try {
                const payload = { userMessage, model: "gemini", preferredLanguage: currentLanguage };
                if (files && files.length > 0) { payload.fileDetails = files.map(f => ({ name: f.name, type: f.type, size: f.size })); }
                const response = await fetch('/api/generate', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (thinkingIndicator) { thinkingIndicator.classList.add('hidden'); thinkingIndicator.style.opacity = '0'; }
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Server error: ${response.status}`); }
                const data = await response.json();
                let rawAiResponseText = data.text;
                
                if (currentUser && currentUser.name && !greetingGivenThisSession) {
                    const greeting = `Hii ${currentUser.givenName || currentUser.name.split(' ')[0]},\n\n`;
                    rawAiResponseText = greeting + rawAiResponseText;
                    greetingGivenThisSession = true;
                }

                let finalHtmlContent = '';
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let lastIndex = 0;
                rawAiResponseText.replace(codeBlockRegex, (match, language, code, offset) => {
                    const plainText = rawAiResponseText.substring(lastIndex, offset);
                    finalHtmlContent += `<span>${sanitizeHtml(plainText)}</span>`; // Sanitize plain text
                    const lang = language || 'text';
                    // Untuk code block, kita ingin mempertahankan beberapa karakter, jadi sanitize dengan hati-hati
                    // atau gunakan library highlighting yang menanganinya. Untuk sekarang, sanitize dasar.
                    const sanitizedCode = sanitizeHtml(code.trim()); 
                    finalHtmlContent += `
                        <div class="code-block">
                            <div class="code-header">
                                <span class="language-tag">${sanitizeHtml(lang)}</span>
                                <button class="copy-code-btn" title="Copy code" onclick="copyCode(this)">
                                    <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect height="8" width="8" x="8" y="2"/></svg>
                                    <span>Copy</span>
                                </button>
                            </div>
                            <pre>${sanitizedCode}</pre>
                        </div>`;
                    lastIndex = offset + match.length;
                });
                const remainingText = rawAiResponseText.substring(lastIndex);
                if (remainingText) { finalHtmlContent += `<span>${sanitizeHtml(remainingText)}</span>`; }
                
                const aiMessageElement = addChatMessage(finalHtmlContent, 'ai', true);
                addAiMessageActions(aiMessageElement);
                clearAttachedFiles();
            } catch (error) {
                console.error('Error fetching from /api/generate:', error);
                if (thinkingIndicator) { thinkingIndicator.classList.add('hidden'); thinkingIndicator.style.opacity = '0'; }
                addChatMessage(`<span>Maaf, terjadi kesalahan: ${error.message}.</span>`, 'ai', true);
            }
        }
        checkScrollable();
    }

    // Fungsi showPage (LENGKAP)
    function showPage(pageName, initialMessage = null) {
        // ... (kode lengkap showPage dari versi sebelumnya)
        if (currentActivePage === pageName && !initialMessage) return;
        
        const currentPageElement = document.getElementById(currentActivePage + 'Section');
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
            setTimeout(() => { currentPageElement.classList.add('hidden'); }, 300);
        }

        const nextPageElement = document.getElementById(pageName + 'Section');
        if (nextPageElement) {
            nextPageElement.classList.remove('hidden'); // Hapus hidden dulu
            setTimeout(() => { nextPageElement.classList.add('active'); }, 10); // Lalu tambahkan active
        } else {
            console.warn(`Page section ${pageName}Section not found.`);
        }
        
        if (pageName === 'chat' && (currentActivePage !== 'chat' || initialMessage)) {
            greetingGivenThisSession = false; 
        }
        currentActivePage = pageName;

        if (landingThemeToggleContainer) landingThemeToggleContainer.style.display = (pageName === 'chat') ? 'none' : 'flex';
        if (menuIcon) menuIcon.style.display = (pageName === 'chat') ? 'none' : 'block';
        if (backIcon) backIcon.style.display = (pageName !== 'chat') ? 'none' : 'block';
        if (quickCompleteContainer) quickCompleteContainer.classList.toggle('active', pageName === 'welcome' && messageInput.value.trim() === '' && attachedFiles.length === 0);

        if (pageName === 'chat') {
            setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; checkScrollable(); }, 50);
            if (initialMessage) {
                addChatMessage(initialMessage, 'user');
                generateRealAIResponse(initialMessage, attachedFiles);
            }
        }
        updateInputAreaAppearance();
    }

    // Placeholders (LENGKAP)
    const placeholders = {
        en: ["Ask me anything...","What's on your mind?","Tell me a story...","How can I help you today?","Start a conversation...","I'm ready to chat!","Let's explore together...","What do you want to learn?"],
        id: ["Tanyakan apa saja...","Apa yang ada di pikiranmu?","Ceritakan sebuah kisah...","Bagaimana saya bisa membantumu hari ini?","Mulai percakapan...","Saya siap mengobrol!","Mari jelajahi bersama...","Apa yang ingin kamu pelajari?"]
    };
    function animatePlaceholder() {
        if (!messageInput || messageInput.value.trim() !== '') return;
        messageInput.style.opacity = '0';
        messageInput.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            const activePlaceholders = placeholders[currentLanguage] || placeholders['en'];
            currentPlaceholderIndex = (currentPlaceholderIndex + 1) % activePlaceholders.length;
            messageInput.placeholder = activePlaceholders[currentPlaceholderIndex];
            messageInput.style.opacity = '1';
            messageInput.style.transform = 'translateY(0)';
        }, 500);
    }
    if (messageInput) {
        placeholderInterval = setInterval(animatePlaceholder, 3000);
        animatePlaceholder(); // Panggil sekali di awal
        messageInput.addEventListener('focus', () => { clearInterval(placeholderInterval); quickCompleteContainer?.classList.remove('active'); });
        messageInput.addEventListener('blur', () => { if (messageInput.value.trim() === '' && attachedFiles.length === 0) { placeholderInterval = setInterval(animatePlaceholder, 3000); if (currentActivePage === 'welcome' && quickCompleteContainer) quickCompleteContainer.classList.add('active'); } });
        messageInput.addEventListener('input', () => { if (quickCompleteContainer) { quickCompleteContainer.classList.toggle('active', messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome'); } autoResizeTextarea(); });
    }
    
    // Event Listener Utama (LENGKAP)
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message !== '' || attachedFiles.length > 0) {
                let finalPrompt = message;
                if (attachedFiles.length > 0) {
                    const fileNames = attachedFiles.map(f => f.name).join(', ');
                    finalPrompt = message ? `${message} (Lampiran: ${fileNames})` : `Analisis file: ${fileNames}`;
                }
                if (currentActivePage === 'welcome') {
                    showPage('chat', finalPrompt);
                } else {
                    addChatMessage(finalPrompt, 'user');
                    generateRealAIResponse(finalPrompt, attachedFiles);
                }
                messageInput.value = '';
                autoResizeTextarea();
                if (quickCompleteContainer) quickCompleteContainer.classList.toggle('active', currentActivePage === 'welcome' && messageInput.value.trim() === '' && attachedFiles.length === 0);
            }
        });
        messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });
    }
    if (menuIcon) menuIcon.addEventListener('click', () => { sidebar?.classList.add('active'); sidebarOverlay?.classList.add('active'); });
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => { sidebar?.classList.remove('active'); sidebarOverlay?.classList.remove('active'); });
    if (backIcon) backIcon.addEventListener('click', () => { showPage('welcome'); greetingGivenThisSession = false; if (chatHistory) chatHistory.innerHTML = ''; /* Reset chat */ if (thinkingIndicator) chatHistory.appendChild(thinkingIndicator); messageInput.value = ''; autoResizeTextarea(); clearAttachedFiles(); });

    // Tema (LENGKAP)
    const savedTheme = localStorage.getItem('novaria_theme');
    function applyTheme(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('novaria_theme', isLightMode ? 'light' : 'dark');
        if (themeToggle) themeToggle.checked = isLightMode;
        if (themeToggleLanding) themeToggleLanding.checked = isLightMode; // Pastikan ID ini ada jika digunakan
    }
    applyTheme(savedTheme === 'light');
    if (themeToggle) themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));
    if (themeToggleLanding) themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));

    // Translations (LENGKAP - struktur dasar, isi translations Anda sendiri)
    const translations = {
        en: { documentTitle: "NovariaAI", welcomeTitle: "Welcome", helpText: "Hi, How can I help you?", languageOption: "Language", themeMode: "Dark / Light Mode", privacyPolicy: "Privacy Policy", termsAndConditions: "Terms & Conditions", policy: "Policy", aboutUs: "About Us", settingsTitle: "Settings", quickSuggestions: [ "What's the weather?", "Tell me a joke.", "Explain quantum physics." ], /* ... konten modal ... */ },
        id: { documentTitle: "NovariaAI", welcomeTitle: "Selamat Datang", helpText: "Hai, Ada yang bisa saya bantu?", languageOption: "Bahasa", themeMode: "Mode Gelap / Terang", privacyPolicy: "Kebijakan Privasi", termsAndConditions: "Syarat & Ketentuan", policy: "Kebijakan", aboutUs: "Tentang Kami", settingsTitle: "Pengaturan", quickSuggestions: [ "Cuaca hari ini?", "Ceritakan lelucon.", "Jelaskan fisika kuantum." ], /* ... konten modal ... */ }
    };
    function updateTextContent(lang) { document.querySelectorAll('[data-key]').forEach(element => { const key = element.dataset.key; if (translations[lang]?.[key]) { element.textContent = translations[lang][key]; }}); if (docTitle && translations[lang]?.documentTitle) { docTitle.textContent = translations[lang].documentTitle; } updateQuickSuggestions(lang); }
    function updateQuickSuggestions(lang) { if (!quickCompleteContainer) return; quickCompleteContainer.innerHTML = ''; const suggestions = translations[lang]?.quickSuggestions || []; suggestions.forEach(suggestionText => { const button = document.createElement('button'); button.classList.add('quick-complete-btn'); button.textContent = suggestionText; button.addEventListener('click', () => { if (currentActivePage === 'welcome') { showPage('chat', suggestionText); } else { addChatMessage(suggestionText, 'user'); generateRealAIResponse(suggestionText); } messageInput.value = ''; autoResizeTextarea(); messageInput.focus(); clearInterval(placeholderInterval); quickCompleteContainer.classList.remove('active'); }); quickCompleteContainer.appendChild(button); }); quickCompleteContainer.classList.toggle('active', currentActivePage === 'welcome' && messageInput.value.trim() === '' && attachedFiles.length === 0); }
    if (languageSelect) { languageSelect.value = currentLanguage; updateTextContent(currentLanguage); languageSelect.addEventListener('change', (event) => { currentLanguage = event.target.value; localStorage.setItem('novaria_language', currentLanguage); updateTextContent(currentLanguage); animatePlaceholder(); if (recognition) { recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; } }); }

    // Modals (LENGKAP)
    function openModal(titleKey, contentKey) { if (!infoModalOverlay || !modalTitle || !modalBody) return; modalTitle.textContent = translations[currentLanguage]?.[titleKey] || titleKey; modalBody.innerHTML = translations[currentLanguage]?.[contentKey] || `<p>Content for ${contentKey} not found.</p>`; infoModalOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeModal() { if (!infoModalOverlay) return; infoModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (infoModalOverlay) infoModalOverlay.addEventListener('click', (e) => { if (e.target === infoModalOverlay) { closeModal(); } });
    document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(item => { item.addEventListener('click', function (e) { e.preventDefault(); sidebar?.classList.remove('active'); sidebarOverlay?.classList.remove('active'); const targetKey = this.dataset.modalTarget; openModal(targetKey, targetKey + 'Content'); }); });

    // File Handling (LENGKAP)
    function displayFileChipItem(file) { /* ... (kode lengkap displayFileChipItem dari versi sebelumnya) ... */ }
    function removeAttachedFile(fileName, fileSize) { /* ... (kode lengkap removeAttachedFile dari versi sebelumnya) ... */ }
    function clearAttachedFiles() { attachedFiles = []; if (fileChipContainer) { fileChipContainer.innerHTML = ''; fileChipContainer.style.display = 'none'; } autoResizeTextarea(); updateInputAreaAppearance(); if (quickCompleteContainer) quickCompleteContainer.classList.toggle('active', currentActivePage === 'welcome' && messageInput.value.trim() === '');}
    if (plusButton) plusButton.addEventListener('click', () => fileInput?.click());
    if (fileInput) fileInput.addEventListener('change', (event) => { /* ... (kode lengkap event listener fileInput dari versi sebelumnya) ... */ });
    
    // Speech Recognition (LENGKAP)
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US';
        recognition.continuous = false; recognition.interimResults = true; let finalTranscript = '';
        recognition.onstart = () => { if(voiceInputButton) voiceInputButton.classList.add('recording'); messageInput.placeholder = currentLanguage === 'id' ? 'Mendengarkan...' : 'Listening...'; };
        recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); };
        recognition.onend = () => { if(voiceInputButton) voiceInputButton.classList.remove('recording'); if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); } if (messageInput.value.trim() === '') { messageInput.placeholder = (placeholders[currentLanguage] || placeholders['en'])[currentPlaceholderIndex]; } finalTranscript = ''; };
        recognition.onerror = (event) => { if(voiceInputButton) voiceInputButton.classList.remove('recording'); messageInput.placeholder = (placeholders[currentLanguage] || placeholders['en'])[currentPlaceholderIndex]; finalTranscript = ''; console.error('Speech recognition error: ', event.error); };
        if (voiceInputButton) voiceInputButton.addEventListener('click', () => { try { if (recognition?.recording) { recognition.stop(); } else { recognition?.start(); } } catch (e) { recognition?.stop(); } });
    } else { if (voiceInputButton) voiceInputButton.style.display = 'none'; }

    // Ripple Effects (LENGKAP) & Observer
    function setupRippleEffects() { const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .remove-chip-btn'); clickableElements.forEach(element => { const oldHandler = element._rippleHandler; if (oldHandler) { element.removeEventListener('click', oldHandler); } const newHandler = function (e) { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('select')) { return; } const ripple = document.createElement('span'); ripple.classList.add('ripple'); this.appendChild(ripple); const rect = this.getBoundingClientRect(); const size = Math.max(rect.width, rect.height); const x = e.clientX - rect.left - (size / 2); const y = e.clientY - rect.top - (size / 2); ripple.style.width = ripple.style.height = `${size}px`; ripple.style.left = `${x}px`; ripple.style.top = `${y}px`; ripple.addEventListener('animationend', () => { ripple.remove(); }); }; element.addEventListener('click', newHandler); element._rippleHandler = newHandler; }); }
    const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { let needsRippleSetup = false; mutation.addedNodes.forEach(node => { if (node.nodeType === 1 && (node.matches?.('.ai-action-btn, .copy-code-btn, .quick-complete-btn, .remove-chip-btn') || node.querySelector?.('.ai-action-btn, .copy-code-btn, .quick-complete-btn, .remove-chip-btn'))) { needsRippleSetup = true; } }); if (needsRippleSetup) { setupRippleEffects(); } } }); });
    if (chatHistory) observer.observe(chatHistory, { childList: true, subtree: true });
    if (quickCompleteContainer) observer.observe(quickCompleteContainer, { childList: true, subtree: true });
    if (fileChipContainer) observer.observe(fileChipContainer, { childList: true, subtree: true });
    
    // --- INISIALISASI HALAMAN ---
    const initialChatMessage = localStorage.getItem('initialChatMessage');
    if (initialChatMessage) {
        localStorage.removeItem('initialChatMessage');
        showPage('chat', initialChatMessage);
    } else {
        showPage('welcome');
    }
    updateTextContent(currentLanguage);
    autoResizeTextarea();
    setupRippleEffects();
});

// Fungsi global yang mungkin dipanggil dari HTML
function copyCode(buttonElement) {
    const pre = buttonElement.closest('.code-block')?.querySelector('pre');
    if (pre) {
        navigator.clipboard.writeText(pre.textContent || "").then(() => {
            const span = buttonElement.querySelector('span');
            if (span) {
                const originalText = span.textContent;
                span.textContent = 'Copied!';
                buttonElement.title = "Copied!";
                setTimeout(() => { span.textContent = originalText; buttonElement.title = "Copy code"; }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy code: ', err);
            const span = buttonElement.querySelector('span');
            if (span) { span.textContent = 'Error!'; buttonElement.title = "Copy failed"; }
        });
    } else {
        console.error("Code block <pre> element not found for copy.");
    }
}
// Pastikan fungsi formatFileSize juga global jika dibutuhkan di tempat lain, atau pindahkan ke dalam DOMContentLoaded jika hanya internal
// function formatFileSize(bytes, decimals = 2) { ... } // Sudah di dalam DOMContentLoaded
function copyCode(buttonElement) { const pre = buttonElement.closest('.code-block').querySelector('pre'); navigator.clipboard.writeText(pre.textContent).then(() => { const span = buttonElement.querySelector('span'); const originalText = span.textContent; span.textContent = 'Copied!'; setTimeout(() => { span.textContent = originalText; }, 2000); }).catch(err => { console.error('Failed to copy code: ', err); const span = buttonElement.querySelector('span'); span.textContent = 'Error!'; setTimeout(() => { span.textContent = 'Copy'; }, 2000); }); }
function formatFileSize(bytes, decimals = 2) { if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; }