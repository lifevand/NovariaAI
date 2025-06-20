// === GANTI SELURUH ISI SCRIPT.JS ANDA DENGAN KODE INI ===

document.addEventListener('DOMContentLoaded', () => {
    // === AWAL: PENGECEKAN LOGIN ===
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser');
    let currentUser = null;

    if (isLoggedIn === 'true' && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (!currentUser || !currentUser.name) { // Validasi sederhana
                throw new Error("Invalid user data in storage.");
            }
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded');
        } catch (e) {
            console.error("Error parsing user data or invalid data:", e);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser');
            window.location.href = 'login.html'; // Redirect jika data user tidak valid
            return; // Hentikan eksekusi script
        }
    } else {
        window.location.href = 'login.html'; // Redirect ke halaman login jika belum login
        return; // Hentikan eksekusi script
    }
    // === AKHIR: PENGECEKAN LOGIN ===


    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const menuIcon = document.getElementById('menuIcon');
    const backIcon = document.getElementById('backIcon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    // themeToggle (sidebar) dihapus, themeToggleLanding (header) tetap
    const themeToggleLanding = document.getElementById('themeToggleLanding');
    // languageSelect dihapus
    // docTitle dihapus karena terjemahan judul dihapus
    const quickCompleteContainer = document.getElementById('quickCompleteContainer');
    const chatHistory = document.getElementById('chatHistory');
    const thinkingIndicator = document.getElementById('thinkingIndicator');

    const welcomeSection = document.getElementById('welcomeSection');
    const chatSection = document.getElementById('chatSection');
    const landingThemeToggleContainer = document.getElementById('landingThemeToggleContainer');
    const mainContent = document.querySelector('main');

    let currentActivePage = 'welcome';

    // Modal dan elemen terkait dihapus
    // const infoModalOverlay = document.getElementById('infoModalOverlay');
    // const modalCloseBtn = document.getElementById('modalCloseBtn');
    // const modalTitle = document.getElementById('modalTitle');
    // const modalBody = document.getElementById('modalBody');

    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    const inputWrapper = document.querySelector('.input-wrapper');

    const MAX_FILE_SIZE_KB_NEW = 450;
    const MAX_FILE_SIZE_BYTES_NEW = MAX_FILE_SIZE_KB_NEW * 1024;
    const MAX_FILES_ALLOWED = 5;
    const fileChipContainer = document.getElementById('fileChipContainer');
    let attachedFiles = [];

    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition;

    // Tombol Logout di sidebar dan fungsinya dihapus
    // const logoutButton = document.getElementById('logoutButton');


    function checkScrollable() {
        setTimeout(() => {
            if (!chatHistory) return;
            const isScrollable = chatHistory.scrollHeight > chatHistory.clientHeight;
            const isAtBottom = chatHistory.scrollHeight - chatHistory.scrollTop <= chatHistory.clientHeight + 5;
            if (isScrollable && !isAtBottom) {
                chatHistory.classList.add('has-scroll-fade');
            } else {
                chatHistory.classList.remove('has-scroll-fade');
            }
        }, 100);
    }
    if (chatHistory) {
      chatHistory.addEventListener('scroll', checkScrollable);
    }

    function showPage(pageName, initialMessage = null) {
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
            landingThemeToggleContainer.classList.add('hidden');
            menuIcon.classList.add('hidden');
            backIcon.classList.remove('hidden');
            setTimeout(() => {
                if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
                checkScrollable();
            }, 10);
            quickCompleteContainer.classList.remove('active'); // Quick suggestions dinonaktifkan
        } else {
            landingThemeToggleContainer.classList.remove('hidden');
            menuIcon.classList.remove('hidden');
            backIcon.classList.add('hidden');
            // Quick suggestions dinonaktifkan
            // if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
            //     quickCompleteContainer.classList.add('active');
            // }
        }
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, attachedFiles);
        }
        updateInputAreaAppearance();
    }

    // Placeholder disederhanakan, tidak lagi multilingual
    const placeholders_en = ["Ask me anything...","What's on your mind?","Tell me a story...","How can I help you today?","Start a conversation...","I'm ready to chat!","Let's explore together...","What do you want to learn?"];
    let currentPlaceholderIndex = 0;
    function animatePlaceholder() {
        if (messageInput.value.trim() !== '') return;
        messageInput.style.opacity = '0';
        messageInput.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders_en.length;
            messageInput.placeholder = placeholders_en[currentPlaceholderIndex];
            messageInput.style.opacity = '1';
            messageInput.style.transform = 'translateY(0)';
        }, 500);
    }
    let placeholderInterval = setInterval(animatePlaceholder, 3000);
    animatePlaceholder(); // Panggil sekali di awal
    messageInput.addEventListener('focus', () => {
        clearInterval(placeholderInterval);
        quickCompleteContainer.classList.remove('active'); // Quick suggestions dinonaktifkan
    });
    messageInput.addEventListener('blur', () => {
        if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
            placeholderInterval = setInterval(animatePlaceholder, 3000);
            // Quick suggestions dinonaktifkan
            // if (currentActivePage === 'welcome') {
            //     quickCompleteContainer.classList.add('active');
            // }
        }
    });
    messageInput.addEventListener('input', () => {
        // Quick suggestions dinonaktifkan
        // if (messageInput.value.trim() !== '' || attachedFiles.length > 0) {
        //     quickCompleteContainer.classList.remove('active');
        // } else {
        //     if (currentActivePage === 'welcome') {
        //         quickCompleteContainer.classList.add('active');
        //     }
        // }
        autoResizeTextarea();
    });

    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 120;
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        updateInputAreaAppearance();
    }
    messageInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea();

    function addChatMessage(content, sender = 'user') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            messageElement.textContent = content;
        } else {
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');

            const aiLogoImg = document.createElement('img');
            aiLogoImg.src = 'logo.png';
            aiLogoImg.alt = 'NovaAI Logo';
            aiLogoImg.classList.add('ai-logo');
            aiHeader.appendChild(aiLogoImg);

            const aiNameSpan = document.createElement('span');
            aiNameSpan.classList.add('ai-name');
            aiNameSpan.textContent = 'Novaria';
            aiHeader.appendChild(aiNameSpan);

            const aiModelTagSpan = document.createElement('span');
            aiModelTagSpan.classList.add('ai-model-tag');
            aiModelTagSpan.textContent = "nova-3.5-quantify"; // Bisa diambil dari response API jika model dinamis
            aiHeader.appendChild(aiModelTagSpan);

            messageElement.appendChild(aiHeader);

            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            aiContentContainer.innerHTML = content; // Content is pre-sanitized HTML
            messageElement.appendChild(aiContentContainer);
        }

        if (chatHistory && thinkingIndicator) {
            chatHistory.insertBefore(messageElement, thinkingIndicator);
        } else if (chatHistory) {
            chatHistory.appendChild(messageElement);
        }

        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);

        setTimeout(() => {
            if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable();
        }, 50);

        return messageElement;
    }

    function addAiMessageActions(aiMessageElement) {
        const contentContainer = aiMessageElement.querySelector('.ai-message-content');
        if (!contentContainer || contentContainer.querySelector('.ai-message-actions')) return;

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

        const getResponseText = (contentEl) => {
            let text = '';
            contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
                    text += node.textContent;
                }
            });
            return text.trim();
        };
        const getFullContent = (contentEl) => {
            let fullContent = '';
             contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    fullContent += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SPAN') {
                        fullContent += node.textContent;
                    } else if (node.classList.contains('code-block')) {
                        const langTag = node.querySelector('.language-tag');
                        const lang = langTag ? langTag.textContent.toLowerCase() : 'text';
                        const code = node.querySelector('pre').textContent;
                        fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``;
                    }
                }
            });
            return fullContent.trim();
        };

        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, _messageEl) => { const textToSpeak = getResponseText(contentContainer); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = 'en-US'; /* Bahasa diset default karena fitur bahasa dihapus */ const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const lastUserMessage = Array.from(chatHistory.querySelectorAll('.user-message')).pop(); if (lastUserMessage) { msgEl.remove(); generateRealAIResponse(lastUserMessage.textContent, attachedFiles); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        contentContainer.appendChild(actionsContainer);
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
    }


    async function generateRealAIResponse(userMessage, files = []) {
        if (thinkingIndicator) {
            thinkingIndicator.classList.remove('hidden');
            thinkingIndicator.style.opacity = '1';
        }
        setTimeout(() => {
            if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable();
        }, 0);

        try {
            const modelToUseInAPI = "gemini"; // Anda bisa membuat ini dinamis jika perlu

            const payload = {
                userMessage: userMessage,
                model: modelToUseInAPI // Kirim model yang dipilih ke API
            };

            // Tambahkan detail file jika ada
            if (files && files.length > 0) {
                payload.fileDetails = files.map(f => ({ name: f.name, type: f.type, size: f.size }));
            }

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
            const rawAiResponseText = data.text; // Asumsikan API mengembalikan teks dalam format ini

            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');

                // Personalisasi (opsional, bisa dihapus jika tidak ada currentUser.name)
                let personalizedResponseText = rawAiResponseText;
                if (currentUser && currentUser.name) {
                    const greeting = `Hii ${currentUser.givenName || currentUser.name.split(' ')[0]},\n\n`; // Sapaan lebih personal
                    personalizedResponseText = greeting + rawAiResponseText;
                }

                // Parsing dan rendering Markdown (termasuk code blocks)
                let finalHtmlContent = '';
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let lastIndex = 0;

                personalizedResponseText.replace(codeBlockRegex, (match, language, code, offset) => {
                    // Teks sebelum code block
                    const plainText = personalizedResponseText.substring(lastIndex, offset);
                    // Sanitasi teks biasa (opsional, tergantung output API Anda)
                    const sanitizedText = plainText.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                    finalHtmlContent += `<span>${sanitizedText}</span>`;

                    // Code block
                    const lang = language || 'text'; // Default ke 'text' jika tidak ada bahasa
                    const sanitizedCode = code.trim().replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
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

                // Teks setelah code block terakhir (jika ada)
                const remainingText = personalizedResponseText.substring(lastIndex);
                if (remainingText) {
                    const sanitizedRemainingText = remainingText.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                    finalHtmlContent += `<span>${sanitizedRemainingText}</span>`;
                }


                const aiMessageElement = addChatMessage(finalHtmlContent, 'ai');
                addAiMessageActions(aiMessageElement); // Tambahkan tombol aksi ke pesan AI
                clearAttachedFiles(); // Bersihkan file setelah respons diterima
                checkScrollable();
            }, 300);

        } catch (error) {
            console.error('Error fetching from /api/generate:', error);
            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
                const errorMessage = `<span>Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.</span>`;
                addChatMessage(errorMessage, 'ai');
            }, 300);
        }
    }


    sendButton.addEventListener('click', () => {
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
                addChatMessage(finalPrompt, 'user');
                generateRealAIResponse(finalPrompt, attachedFiles);
            }
            messageInput.value = '';
            autoResizeTextarea();
            // Quick suggestions dinonaktifkan
            // if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
            //     quickCompleteContainer.classList.add('active');
            // } else {
            //     quickCompleteContainer.classList.remove('active');
            // }
        }
    });
    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

    // Hapus initialChatMessageFromStorage karena terjemahan dan quick suggestions dihapus
    // const initialChatMessageFromStorage = localStorage.getItem('initialChatMessage');
    if (isLoggedIn === 'true') {
        showPage('welcome');
    }

    menuIcon.addEventListener('click', () => { sidebar.classList.add('active'); sidebarOverlay.classList.add('active'); });
    sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); });
    backIcon.addEventListener('click', () => {
        showPage('welcome');
        if (chatHistory && thinkingIndicator) {
             chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`;
        } else if (chatHistory) {
            chatHistory.innerHTML = '';
        }
        messageInput.value = '';
        autoResizeTextarea();
        clearAttachedFiles();
        updateInputAreaAppearance();
        // Quick suggestions dinonaktifkan
        // if (currentActivePage === 'welcome') {
        //     quickCompleteContainer.classList.add('active');
        // }
    });

    // Tema hanya dikontrol dari header sekarang
    const savedTheme = localStorage.getItem('novaai_theme');
    if (savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
        themeToggleLanding.checked = true;
    } else {
        document.body.classList.remove('light-mode');
        themeToggleLanding.checked = false;
    }
    function applyTheme(isLightMode) { if (isLightMode) { document.body.classList.add('light-mode'); localStorage.setItem('novaai_theme', 'light-mode'); } else { document.body.classList.remove('light-mode'); localStorage.setItem('novaai_theme', 'dark-mode'); } themeToggleLanding.checked = isLightMode; }
    // themeToggle (sidebar) dihapus, hanya themeToggleLanding (header)
    themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));

    // Objek translations dan fungsi terkait dihapus
    // const translations = { ... };
    // function updateTextContent(lang) { ... }
    // function updateQuickSuggestions(lang) { ... }
    // languageSelect.value = currentLanguage;
    // updateTextContent(currentLanguage);
    // languageSelect.addEventListener('change', ...);

    // Hapus semua fungsi modal
    // function openModal(titleKey, contentKey) { ... }
    // function closeModal() { ... }
    // modalCloseBtn.addEventListener('click', closeModal);
    // infoModalOverlay.addEventListener('click', ...);
    // document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(...);

    function setupRippleEffects() {
        const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .remove-chip-btn');
        clickableElements.forEach(element => {
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }
            const newHandler = function (e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('select')) {
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
    const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { let needsRippleSetup = false; mutation.addedNodes.forEach(node => { if (node.nodeType === 1) { if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn') || node.matches('.remove-chip-btn'))) { needsRippleSetup = true; } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn') || node.querySelector('.remove-chip-btn'))) { needsRippleSetup = true; } } }); if (needsRippleSetup) { setupRippleEffects(); } } }); });
    if (chatHistory) observer.observe(chatHistory, { childList: true, subtree: true });
    // quickCompleteContainer tidak lagi di-observe karena tidak diisi dinamis
    // if (quickCompleteContainer) observer.observe(quickCompleteContainer, { childList: true, subtree: true });
    if (fileChipContainer) observer.observe(fileChipContainer, { childList: true, subtree: true });

    function updateInputAreaAppearance() {
        const inputWrapperHeight = inputWrapper.offsetHeight;
        const totalBottomSpace = inputWrapperHeight + 15;
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`;

        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    plusButton.addEventListener('click', () => { fileInput.click(); });

    function displayFileChipItem(file) {
        const chipItem = document.createElement('div');
        chipItem.classList.add('file-chip-item');
        chipItem.dataset.fileName = file.name;
        chipItem.dataset.fileSize = file.size;

        const fileIconContainer = document.createElement('span');
        fileIconContainer.classList.add('file-icon');
        const imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/></svg>`;
        const fileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
        fileIconContainer.innerHTML = file.type.startsWith('image/') ? imageSvg : fileSvg;
        chipItem.appendChild(fileIconContainer);

        const fileDetails = document.createElement('div');
        fileDetails.classList.add('file-details');

        const fileNamePreview = document.createElement('span');
        fileNamePreview.classList.add('file-name-preview');
        const maxNameDisplayLength = 10;
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const fileExt = file.name.substring(file.name.lastIndexOf('.'));
        fileNamePreview.textContent = fileNameWithoutExt.length > maxNameDisplayLength ?
                                    fileNameWithoutExt.substring(0, maxNameDisplayLength) + "..." + fileExt :
                                    file.name;
        fileNamePreview.title = file.name;
        fileDetails.appendChild(fileNamePreview);

        const fileSizePreview = document.createElement('span');
        fileSizePreview.classList.add('file-size-preview');
        fileSizePreview.textContent = formatFileSize(file.size);
        fileDetails.appendChild(fileSizePreview);
        chipItem.appendChild(fileDetails);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-chip-btn');
        removeButton.innerHTML = '×';
        removeButton.title = `Remove ${file.name}`;
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            removeAttachedFile(file.name, file.size);
        });
        chipItem.appendChild(removeButton);

        fileChipContainer.appendChild(chipItem);
        setTimeout(() => chipItem.classList.add('visible'), 10);

        if (fileChipContainer.children.length > 0) {
            fileChipContainer.style.display = 'flex';
            fileChipContainer.scrollLeft = fileChipContainer.scrollWidth;
        }
        autoResizeTextarea();
        updateInputAreaAppearance();
    }

    function removeAttachedFile(fileName, fileSize) {
        attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSize));
        const fileItemToRemove = fileChipContainer.querySelector(
            `.file-chip-item[data-file-name="${CSS.escape(fileName)}"][data-file-size="${fileSize}"]`
        );
        if (fileItemToRemove) {
            fileItemToRemove.classList.remove('visible');
            setTimeout(() => {
                fileItemToRemove.remove();
                if (fileChipContainer.children.length === 0) {
                    fileChipContainer.style.display = 'none';
                }
                autoResizeTextarea();
                updateInputAreaAppearance();
            }, 300);
        }
        // Quick suggestions dinonaktifkan
        // if (attachedFiles.length === 0 && messageInput.value.trim() === '' && currentActivePage === 'welcome') {
        //     quickCompleteContainer.classList.add('active');
        // }
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        fileChipContainer.innerHTML = '';
        fileChipContainer.style.display = 'none';
        autoResizeTextarea();
        updateInputAreaAppearance();
        // Quick suggestions dinonaktifkan
        // if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
        //     quickCompleteContainer.classList.add('active');
        // }
    }

    fileInput.addEventListener('change', (event) => {
        const filesToProcess = Array.from(event.target.files);
        if (filesToProcess.length === 0) return;

        let canAddCount = MAX_FILES_ALLOWED - attachedFiles.length;

        if (canAddCount <= 0) {
            alert(`You have reached the maximum of ${MAX_FILES_ALLOWED} files.`);
            fileInput.value = '';
            return;
        }

        const newValidFiles = [];

        for (const file of filesToProcess) {
            if (newValidFiles.length >= canAddCount) {
                alert(`You can only add ${canAddCount} more file(s). Some files were not added.`);
                break;
            }
            if (file.size > MAX_FILE_SIZE_BYTES_NEW) {
                alert(`File "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum size of ${formatFileSize(MAX_FILE_SIZE_BYTES_NEW, 0)}.`);
                continue;
            }
            const isDuplicate = attachedFiles.some(f => f.name === file.name && f.size === file.size);
            if (isDuplicate) {
                alert(`File "${file.name}" is already attached.`);
                continue;
            }
            newValidFiles.push(file);
        }

        newValidFiles.forEach(file => {
            attachedFiles.push(file);
            displayFileChipItem(file);
        });

        fileInput.value = '';
        // Quick suggestions dinonaktifkan
        // if (attachedFiles.length > 0 || messageInput.value.trim() !== '') {
        //     quickCompleteContainer.classList.remove('active');
        // }
    });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Bahasa diset default karena fitur bahasa dihapus
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';
        recognition.onstart = () => { voiceInputButton.style.backgroundColor = 'red'; messageInput.placeholder = 'Listening...'; };
        recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); };
        recognition.onend = () => { voiceInputButton.style.backgroundColor = ''; if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); } if (messageInput.value.trim() === '') { messageInput.placeholder = placeholders_en[currentPlaceholderIndex]; } finalTranscript = ''; };
        recognition.onerror = (event) => { voiceInputButton.style.backgroundColor = ''; messageInput.placeholder = placeholders_en[currentPlaceholderIndex]; finalTranscript = ''; alert('Speech recognition error: ' + event.error); };
        voiceInputButton.addEventListener('click', () => { try { if (recognition && typeof recognition.stop === 'function' && recognition.recording) { recognition.stop(); } else { recognition.start(); } } catch (e) { if (recognition && typeof recognition.stop === 'function') recognition.stop(); } });
    } else {
        voiceInputButton.style.display = 'none';
    }

    // Panggil showPage setelah semua setup, memastikan halaman yang benar ditampilkan
    // showPage(currentActivePage); // Sudah dipanggil di blok pengecekan login jika berhasil
});

// Fungsi global untuk copy code tetap ada
function copyCode(buttonElement) { const pre = buttonElement.closest('.code-block').querySelector('pre'); navigator.clipboard.writeText(pre.textContent).then(() => { const span = buttonElement.querySelector('span'); const originalText = span.textContent; span.textContent = 'Copied!'; setTimeout(() => { span.textContent = originalText; }, 2000); }).catch(err => { console.error('Failed to copy code: ', err); const span = buttonElement.querySelector('span'); span.textContent = 'Error!'; setTimeout(() => { span.textContent = 'Copy'; }, 2000); }); }
function formatFileSize(bytes, decimals = 2) { if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; }