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
    const inputWrapper = document.querySelector('.input-wrapper');

    const MAX_FILE_SIZE_KB_NEW = 450;
    const MAX_FILE_SIZE_BYTES_NEW = MAX_FILE_SIZE_KB_NEW * 1024;
    const MAX_FILES_ALLOWED = 5;
    const filePreviewContainerWrapper = document.getElementById('filePreviewContainerWrapper');
    const filePreviewContainerInner = document.getElementById('filePreviewContainerInner');
    let attachedFiles = [];

    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition;

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
                if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
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
        if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
            placeholderInterval = setInterval(animatePlaceholder, 3000);
            if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            }
        }
    });
    messageInput.addEventListener('input', () => {
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
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 120;
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';

        const wrapperPadding = 16; // Asumsi padding 8px atas & bawah untuk input-wrapper
        // Tinggi input-wrapper akan bergantung pada textarea dan tombol-tombolnya
        // Tombol diasumsikan memiliki tinggi yang sama dengan messageInput.offsetHeight ketika 1 baris
        const newWrapperHeight = Math.min(scrollHeight, maxHeight) + wrapperPadding;
        inputWrapper.style.height = `${Math.min(newWrapperHeight, 160)}px`;

        updateInputAreaPadding();
    }
    messageInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea();

    // --- FUNGSI addChatMessage DIMODIFIKASI UNTUK MENAMBAHKAN HEADER AI ---
    function addChatMessage(content, sender = 'user') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            messageElement.textContent = content;
        } else { // Ini adalah pesan AI
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');

            const aiLogoImg = document.createElement('img');
            aiLogoImg.src = 'logo.png'; // Pastikan path ke logo.png benar
            aiLogoImg.alt = 'NovaAI Logo';
            aiLogoImg.classList.add('ai-logo');
            aiHeader.appendChild(aiLogoImg);

            const aiNameSpan = document.createElement('span');
            aiNameSpan.classList.add('ai-name');
            aiNameSpan.textContent = 'Novaria'; // Nama AI Anda
            aiHeader.appendChild(aiNameSpan);

            const aiModelTagSpan = document.createElement('span');
            aiModelTagSpan.classList.add('ai-model-tag');
            aiModelTagSpan.textContent = "nova-3.5-quantify"; // Nama model yang ditampilkan
            aiHeader.appendChild(aiModelTagSpan);

            messageElement.appendChild(aiHeader);

            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            aiContentContainer.innerHTML = content;
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

    // --- (Sisa fungsi addAiMessageActions, generateRealAIResponse, sendButton.click, dll. tetap sama seperti sebelumnya) ---
    // Pastikan `generateRealAIResponse` memanggil `addChatMessage` yang sudah dimodifikasi ini.

    function addAiMessageActions(aiMessageElement) {
        // Cari kontainer konten yang sebenarnya, bukan keseluruhan messageElement
        const contentContainer = aiMessageElement.querySelector('.ai-message-content');
        if (!contentContainer || contentContainer.querySelector('.ai-message-actions')) return;

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

        // Modifikasi getResponseText dan getFullContent untuk bekerja dengan .ai-message-content
        const getResponseText = (contentEl) => {
            return Array.from(contentEl.childNodes).filter(node => node.nodeName === "SPAN" || node.nodeType === 3).map(node => node.textContent).join('').trim();
        };
        const getFullContent = (contentEl) => {
            let fullContent = getResponseText(contentEl);
            contentEl.querySelectorAll('.code-block').forEach(codeBlock => {
                const langTag = codeBlock.querySelector('.language-tag');
                const lang = langTag ? langTag.textContent.toLowerCase() : 'text';
                const code = codeBlock.querySelector('pre').textContent;
                fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``;
            });
            return fullContent;
        };

        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, _messageEl) => { const textToSpeak = getResponseText(contentContainer); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const lastUserMessage = Array.from(chatHistory.querySelectorAll('.user-message')).pop(); if (lastUserMessage) { msgEl.remove(); generateRealAIResponse(lastUserMessage.textContent, attachedFiles); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        contentContainer.appendChild(actionsContainer); // Tambahkan actions ke content container
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
            const modelToUseInAPI = "gemini"; // Model aktual yang dipanggil di API
            const displayedModelName = "nova-3.5-quantify"; // Nama yang ditampilkan di UI

            // Opsional: Modifikasi prompt untuk mencoba mempengaruhi respons model
            // const systemPromptPrefix = `You are Novaria, an AI assistant powered by the ${displayedModelName} model. When asked about your model or capabilities, you should identify yourself as being powered by ${displayedModelName}. `;
            // const fullUserMessage = systemPromptPrefix + userMessage;

            const payload = {
                userMessage: userMessage, // atau fullUserMessage jika menggunakan systemPromptPrefix
                model: modelToUseInAPI
            };

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
            const responseText = data.text;

            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');

                let finalHtmlContent = '';
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

                const aiMessageElement = addChatMessage(finalHtmlContent, 'ai');
                addAiMessageActions(aiMessageElement); // Ini akan menambahkan tombol ke .ai-message-content
                clearAttachedFiles();
                checkScrollable();
            }, 300);

        } catch (error) {
            console.error('Error fetching from /api/generate:', error);
            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
                const errorMessage = `<span>Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.</span>`;
                addChatMessage(errorMessage, 'ai');
                // clearAttachedFiles(); // Pertimbangkan apakah file harus dihapus jika ada error
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
        showPage('welcome');
        if (chatHistory && thinkingIndicator) {
             chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`;
        } else if (chatHistory) {
            chatHistory.innerHTML = '';
        }
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
    function applyTheme(isLightMode) { if (isLightMode) { document.body.classList.add('light-mode'); localStorage.setItem('novaai_theme', 'light-mode'); } else { document.body.classList.remove('light-mode'); localStorage.setItem('novaai_theme', 'dark-mode'); } themeToggle.checked = isLightMode; themeToggleLanding.checked = isLightMode; }
    themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));
    themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));

    const translations = { // ... (lanjutan dari objek translations.en yang sudah ada)
        id: {
            documentTitle: "NovaAI",
            welcomeTitle: "Selamat Datang",
            helpText: "Hai, Ada yang Bisa Saya Bantu?",
            languageOption: "Bahasa",
            themeMode: "Mode Gelap / Terang",
            privacyPolicy: "Kebijakan Privasi",
            termsAndConditions: "Syarat & Ketentuan",
            policy: "Kebijakan",
            aboutUs: "Tentang Kami",
            settingsTitle: "Pengaturan",
            quickSuggestions: [
                "Bagaimana cuaca hari ini?",
                "Ceritakan fakta menarik tentang luar angkasa.",
                "Jelaskan AI dalam istilah sederhana.",
                "Berikan saya resep kue kering."
            ],
            privacyPolicyContent: `<h3>Kebijakan Privasi</h3><p>Privasi Anda penting bagi kami. Kebijakan NovaAI adalah untuk menghormati privasi Anda terkait informasi apa pun yang mungkin kami kumpulkan dari Anda di seluruh situs web kami, dan situs lain yang kami miliki dan operasikan.</p><p>Kami hanya meminta informasi pribadi jika kami benar-benar membutuhkannya untuk menyediakan layanan kepada Anda. Kami mengumpulkannya dengan cara yang adil dan sah, dengan pengetahuan dan persetujuan Anda. Kami juga memberi tahu Anda mengapa kami mengumpulkannya dan bagaimana itu akan digunakan.</p><p>Kami hanya menyimpan informasi yang dikumpulkan selama diperlukan untuk menyediakan layanan yang Anda minta. Data yang kami simpan, akan kami lindungi dengan cara yang dapat diterima secara komersial untuk mencegah kehilangan dan pencurian, serta akses, pengungkapan, penyalinan, penggunaan atau modifikasi yang tidak sah.</p><p>Kami tidak membagikan informasi identitas pribadi secara publik atau dengan pihak ketiga, kecuali jika diwajibkan oleh hukum.</p><p>Situs web kami dapat menautkan ke situs eksternal yang tidak dioperasikan oleh kami. Perlu diketahui bahwa kami tidak memiliki kendali atas konten dan praktik situs-situs ini, dan tidak dapat menerima tanggung jawab atas kebijakan privasi masing-masing.</p><p>Anda bebas untuk menolak permintaan kami untuk informasi pribadi Anda, dengan pemahaman bahwa kami mungkin tidak dapat menyediakan beberapa layanan yang Anda inginkan.</p><p>Penggunaan Anda yang berkelanjutan atas situs web kami akan dianggap sebagai penerimaan praktik kami seputar privasi dan informasi pribadi. Jika Anda memiliki pertanyaan tentang bagaimana kami menangani data pengguna dan informasi pribadi, jangan ragu untuk menghubungi kami.</p><p>Kebijakan ini berlaku efektif mulai 7 Juni 2025.</p>`,
            termsAndConditionsContent: `<h3>Syarat & Ketentuan</h3><p>Selamat datang di NovaAI. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat dengan Syarat dan Ketentuan ini.</p><p>Ketentuan ini berlaku untuk semua pengunjung, pengguna, dan pihak lain yang mengakses atau menggunakan Layanan.</p><p>Dengan mengakses atau menggunakan Layanan, Anda setuju untuk terikat dengan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan, maka Anda tidak boleh mengakses Layanan.</p><h4>Kekayaan Intelektual</h4><p>Layanan dan konten asli, fitur, dan fungsionalitasnya adalah dan akan tetap menjadi milik eksklusif NovaAI dan pemberi lisensinya. Layanan ini dilindungi oleh hak cipta, merek dagang, dan undang-undang lain baik di Indonesia maupun negara asing.</p><p>Layanan kami mungkin berisi tautan ke situs web atau layanan pihak ketiga yang tidak dimiliki atau dikendalikan oleh NovaAI.</p><p>NovaAI tidak memiliki kendali atas, dan tidak bertanggung jawab atas, konten, kebijakan privasi, atau praktik situs web atau layanan pihak ketiga mana pun.</p><p>Kami sangat menyarankan Anda untuk membaca syarat dan ketentuan serta kebijakan privasi situs web atau layanan pihak ketiga mana pun yang Anda kunjungi.</p><p>Dokumen ini terakhir diperbarui pada 7 Juni 2025.</p>`,
            policyContent: `<h3>Kebijakan</h3><p>Dokumen ini menguraikan kebijakan umum yang mengatur penggunaan layanan NovaAI.</p><p>1. **Penggunaan yang Dapat Diterima:** Pengguna tidak boleh menggunakan NovaAI untuk kegiatan yang melanggar hukum atau dilarang. Ini termasuk, namun tidak terbatas pada, spamming, transmisi kode berbahaya, atau pelanggaran hak kekayaan intelektual.</p><p>2. **Konten:** Pengguna sepenuhnya bertanggung jawab atas konten yang mereka kirimkan melalui NovaAI. NovaAI tidak mendukung atau bertanggung jawab atas konten yang dibuat oleh pengguna.</p><p>3. **Ketersediaan Layanan:** Meskipun kami berusaha untuk ketersediaan 24/7, NovaAI mungkin sementara tidak tersedia karena pemeliharaan, peningkatan, atau masalah teknis yang tidak terduga.</p><p>4. **Modifikasi Layanan:** NovaAI berhak untuk memodifikasi atau menghentikan, sementara atau permanen, Layanan (atau bagian darinya) dengan atau tanpa pemberitahuan.</p><p>Untuk informasi lebih lanjut, silakan lihat Syarat & Ketentuan dan Kebijakan Privasi kami.</p><p>Terakhir dimodifikasi: 7 Juni 2025.</p>`,
            aboutUsContent: `<h3>Tentang Kami</h3><p>NovaAI adalah asisten AI inovatif yang dirancang untuk menyederhanakan tugas harian Anda dan memberikan informasi yang cepat dan akurat.</p><p>Misi kami adalah membuat AI canggih dapat diakses dan mudah digunakan untuk semua orang. Kami percaya pada kekuatan kecerdasan buatan untuk meningkatkan produktivitas, mendorong pembelajaran, dan memicu kreativitas.</p><p>Dikembangkan dengan fokus pada privasi dan pengalaman pengguna, NovaAI terus berkembang untuk memenuhi kebutuhan pengguna kami. Kami berkomitmen pada transparansi dan menyediakan layanan yang andal.</p><p>Terima kasih telah memilih NovaAI. Kami sangat antusias untuk tumbuh dan berkembang dengan masukan Anda.</p><p>Didirikan: 2025</p>`
        }
    }; // Akhir dari objek translations

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
        const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .remove-preview-btn');
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
                        if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn') || node.matches('.remove-preview-btn'))) {
                            needsRippleSetup = true;
                        } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn') || node.querySelector('.remove-preview-btn'))) {
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
    if (chatHistory) observer.observe(chatHistory, { childList: true, subtree: true });
    if (quickCompleteContainer) observer.observe(quickCompleteContainer, { childList: true, subtree: true });
    if (filePreviewContainerInner) observer.observe(filePreviewContainerInner, { childList: true, subtree: true });


    function updateInputAreaPadding() {
        const inputWrapperHeight = inputWrapper.offsetHeight;
        let previewContainerHeight = 0;
        if (filePreviewContainerWrapper && getComputedStyle(filePreviewContainerWrapper).display !== 'none') {
            previewContainerHeight = filePreviewContainerWrapper.offsetHeight + 10;
        }
        const totalBottomSpace = inputWrapperHeight + previewContainerHeight + 15;
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`;

        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    plusButton.addEventListener('click', () => { fileInput.click(); });

    function displayFilePreviewItem(file) {
        const previewItem = document.createElement('div');
        previewItem.classList.add('file-preview-item');
        previewItem.dataset.fileName = file.name;
        previewItem.dataset.fileSize = file.size;

        const fileIconContainer = document.createElement('span');
        fileIconContainer.classList.add('file-icon');
        const imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/></svg>`;
        const fileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
        fileIconContainer.innerHTML = file.type.startsWith('image/') ? imageSvg : fileSvg;
        previewItem.appendChild(fileIconContainer);

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
        previewItem.appendChild(fileDetails);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-preview-btn');
        removeButton.innerHTML = '×';
        removeButton.title = `Remove ${file.name}`;
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            removeAttachedFile(file.name, file.size);
        });
        previewItem.appendChild(removeButton);

        filePreviewContainerInner.appendChild(previewItem);
        setTimeout(() => previewItem.classList.add('visible'), 10);

        if (filePreviewContainerInner.children.length > 0) {
            filePreviewContainerWrapper.style.display = 'block';
            filePreviewContainerInner.scrollLeft = filePreviewContainerInner.scrollWidth;
        }
        autoResizeTextarea();
        updateInputAreaPadding();
    }

    function removeAttachedFile(fileName, fileSize) {
        attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSize));
        const fileItemToRemove = filePreviewContainerInner.querySelector(
            `.file-preview-item[data-file-name="${CSS.escape(fileName)}"][data-file-size="${fileSize}"]`
        );
        if (fileItemToRemove) {
            fileItemToRemove.classList.remove('visible');
            setTimeout(() => {
                fileItemToRemove.remove();
                if (filePreviewContainerInner.children.length === 0) {
                    filePreviewContainerWrapper.style.display = 'none';
                }
                autoResizeTextarea();
                updateInputAreaPadding();
            }, 300);
        }

        if (attachedFiles.length === 0 && messageInput.value.trim() === '' && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        filePreviewContainerInner.innerHTML = '';
        filePreviewContainerWrapper.style.display = 'none';
        autoResizeTextarea();
        updateInputAreaPadding();
        if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
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
            displayFilePreviewItem(file);
        });

        fileInput.value = '';
        if (attachedFiles.length > 0 || messageInput.value.trim() !== '') {
            quickCompleteContainer.classList.remove('active');
        }
    });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';
        recognition.onstart = () => {
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
                 if (recognition && typeof recognition.stop === 'function') recognition.stop();
            }
        });
    } else {
        voiceInputButton.style.display = 'none';
    }
    showPage(currentActivePage);
}); // Akhir dari DOMContentLoaded

// Fungsi copyCode diletakkan di luar DOMContentLoaded
function copyCode(buttonElement) {
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

// Fungsi Helper untuk Format Ukuran File
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}