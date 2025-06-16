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

    const modelSelectContainer = document.getElementById('modelSelectContainer');
    const modelSelect = document.getElementById('modelSelect');
    const selectedModelDisplay = document.querySelector('.selected-model-display');
    let selectedModel = modelSelect.value;

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

    // --- FUNGSI BARU UNTUK EFEK REDUP/VIGNETTE SCROLL ---
    function checkScrollable() {
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
    // ---------------------------------------------------

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
            modelSelectContainer.classList.add('hidden');
            menuIcon.classList.add('hidden');
            backIcon.classList.remove('hidden');
            setTimeout(() => {
                chatHistory.scrollTop = chatHistory.scrollHeight;
                checkScrollable();
            }, 10);
            quickCompleteContainer.classList.remove('active');
        } else {
            landingThemeToggleContainer.classList.remove('hidden');
            modelSelectContainer.classList.remove('hidden');
            menuIcon.classList.remove('hidden');
            backIcon.classList.add('hidden');
            if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                quickCompleteContainer.classList.add('active');
            }
        }
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, selectedModel, attachedFiles);
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
        messageInput.style.height = messageInput.scrollHeight + 'px';
        const computedStyle = getComputedStyle(messageInput);
        const newWrapperHeight = messageInput.scrollHeight + (10 * 2);
        inputWrapper.style.height = `${Math.min(newWrapperHeight, 160)}px`;
        updateInputAreaPadding();
    }
    messageInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea();

    // --- FUNGSI addChatMessage BARU (Menerima HTML) ---
    function addChatMessage(content, sender = 'user') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        if (sender === 'user') {
            messageElement.textContent = content;
        } else {
            messageElement.innerHTML = content;
        }
        chatHistory.insertBefore(messageElement, thinkingIndicator);
        setTimeout(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable();
        }, 0);
        setTimeout(() => { messageElement.style.opacity = '1'; }, 10);
        return messageElement;
    }

    // --- FUNGSI typeMessage dan addCodeBlock SUDAH DIHAPUS ---

    // --- FUNGSI addAiMessageActions (tidak berubah) ---
    function addAiMessageActions(aiMessageElement) {
        if (aiMessageElement.querySelector('.ai-message-actions')) return;
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');
        const getResponseText = (messageEl) => { /* ... (kode tidak berubah) ... */ return Array.from(messageEl.childNodes).filter(node => node.nodeName === "SPAN" || node.nodeType === 3).map(node => node.textContent).join('').trim(); };
        const getFullContent = (messageEl) => { /* ... (kode tidak berubah) ... */ let fullContent = getResponseText(messageEl); messageEl.querySelectorAll('.code-block').forEach(codeBlock => { const lang = codeBlock.querySelector('.language-tag').textContent.toLowerCase(); const code = codeBlock.querySelector('pre').textContent; fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``; }); return fullContent; };
        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, messageEl) => { const fullContent = getFullContent(messageEl); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, messageEl) => { const textToSpeak = getResponseText(messageEl); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, messageEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const lastUserMessage = Array.from(chatHistory.querySelectorAll('.user-message')).pop(); if (lastUserMessage) { messageEl.remove(); generateRealAIResponse(lastUserMessage.textContent, selectedModel, attachedFiles); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, messageEl) => { const fullContent = getFullContent(messageEl); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        aiMessageElement.appendChild(actionsContainer);
        setTimeout(() => { chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
    }

    // --- FUNGSI generateRealAIResponse BARU ---
    async function generateRealAIResponse(userMessage, model, files = []) {
        thinkingIndicator.classList.remove('hidden');
        thinkingIndicator.style.opacity = '1';
        setTimeout(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
            checkScrollable();
        }, 0);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage, model }),
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
                addAiMessageActions(aiMessageElement);
                clearAttachedFiles();
                checkScrollable();
            }, 300);

        } catch (error) {
            console.error('Error fetching from /api/generate:', error);
            thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                thinkingIndicator.classList.add('hidden');
                const errorMessage = `<span>Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.</span>`;
                addChatMessage(errorMessage, 'ai');
                clearAttachedFiles();
            }, 300);
        }
    }

    sendButton.addEventListener('click', () => { /* ... (kode tidak berubah) ... */ const message = messageInput.value.trim(); if (message !== '' || attachedFiles.length > 0) { let finalPrompt = message; if (attachedFiles.length > 0 && message === '') { const fileNames = attachedFiles.map(f => f.name).join(', '); finalPrompt = `Harap menganalisis file-file ini: ${fileNames}`; } else if (attachedFiles.length > 0) { const fileNames = attachedFiles.map(f => f.name).join(', '); finalPrompt = `${message} (Dilampirkan: ${fileNames})`; } if (currentActivePage === 'welcome') { showPage('chat', finalPrompt); } else { addChatMessage(message, 'user'); generateRealAIResponse(message, selectedModel, attachedFiles); } messageInput.value = ''; autoResizeTextarea(); if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') { quickCompleteContainer.classList.add('active'); } else { quickCompleteContainer.classList.remove('active'); } } });
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
    backIcon.addEventListener('click', () => { showPage('welcome'); chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`; messageInput.value = ''; attachedFiles = []; attachedFilesContainer.innerHTML = ''; updateInputAreaPadding(); if (currentActivePage === 'welcome') { quickCompleteContainer.classList.add('active'); } });

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

    const translations = { /* ... (kode tidak berubah) ... */ en: { documentTitle: "NovaAI", welcomeTitle: "Welcome", helpText: "Hii, I Can Help You?", languageOption: "Language", themeMode: "Dark / Light Mode", privacyPolicy: "Privacy Policy", termsAndConditions: "Terms & Conditions", policy: "Policy", aboutUs: "About Us", settingsTitle: "Settings", quickSuggestions: [ "What's the weather like today?", "Tell me a fun fact about space.", "Explain AI in simple terms.", "Give me a recipe for cookies." ], privacyPolicyContent: `<h3>Privacy Policy</h3><p>Your privacy is important to us. It is NovaAI's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p><p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p><p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p><p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p><p>Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p><p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p><p>Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p><p>This policy is effective as of June 7, 2025.</p>`, termsAndConditionsContent: `<h3>Terms & Conditions</h3><p>Welcome to NovaAI. By accessing or using our services, you agree to be bound by these Terms and Conditions.</p><p>These Terms apply to all visitors, users and others who access or use the Service.</p><p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p><h4>Intellectual Property</h4><p>The Service and its original content, features and functionality are and will remain the exclusive property of NovaAI and its licensors. The Service is protected by copyright, trademark, and other laws of both the Indonesia and foreign countries.</p><p>Our Service may contain links to third-party web sites or services that are not owned or controlled by NovaAI.</p><p>NovaAI has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p><p>We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.</p><p>This document was last updated on June 7, 2025.</p>`, policyContent: `<h3>Policy</h3><p>This document outlines the general policies governing the use of NovaAI services.</p><p>1. **Acceptable Use:** Users must not use NovaAI for any unlawful or prohibited activities. This includes, but is not limited to, spamming, transmitting harmful code, or infringing on intellectual property rights.</p><p>2. **Content:** Users are solely responsible for the content they submit through NovaAI. NovaAI does not endorse or assume responsibility for any user-generated content.</p><p>3. **Service Availability:** While we strive for 24/7 availability, NovaAI may be temporarily unavailable due to maintenance, upgrades, or unforeseen technical issues.</p><p>4. **Modifications to Service:** NovaAI reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.</p><p>For more detailed information, please refer to our Terms & Conditions and Privacy Policy.</p><p>Last modified: June 7, 2025.</p>`, aboutUsContent: `<h3>About Us</h3><p>NovaAI is an innovative AI assistant designed to simplify your daily tasks and provide quick, accurate information.</p><p>Our mission is to make advanced AI accessible and user-friendly for everyone. We believe in the power of artificial intelligence to enhance productivity, foster learning, and spark creativity.</p><p>Developed with a focus on privacy and user experience, NovaAI continuously evolves to meet the needs of our users. We are committed to transparency and providing a reliable service.</p><p>Thank you for choosing NovaAI. We're excited to grow and improve with your feedback.</p><p>Founded: 2025</p>` }, id: { /* ... (kode tidak berubah) ... */ documentTitle: "NovaAI", welcomeTitle: "Selamat Datang", helpText: "Hai, Ada yang Bisa Saya Bantu?", languageOption: "Bahasa", themeMode: "Mode Gelap / Terang", privacyPolicy: "Kebijakan Privasi", termsAndConditions: "Syarat & Ketentuan", policy: "Kebijakan", aboutUs: "Tentang Kami", settingsTitle: "Pengaturan", quickSuggestions: [ "Bagaimana cuaca hari ini?", "Ceritakan fakta menarik tentang luar angkasa.", "Jelaskan AI dalam istilah sederhana.", "Berikan saya resep kue kering." ], privacyPolicyContent: `<h3>Kebijakan Privasi</h3><p>Privasi Anda penting bagi kami. Kebijakan NovaAI adalah untuk menghormati privasi Anda terkait informasi apa pun yang mungkin kami kumpulkan dari Anda di seluruh situs web kami, dan situs lain yang kami miliki dan operasikan.</p><p>Kami hanya meminta informasi pribadi jika kami benar-benar membutuhkannya untuk menyediakan layanan kepada Anda. Kami mengumpulkannya dengan cara yang adil dan sah, dengan pengetahuan dan persetujuan Anda. Kami juga memberi tahu Anda mengapa kami mengumpulkannya dan bagaimana itu akan digunakan.</p><p>Kami hanya menyimpan informasi yang dikumpulkan selama diperlukan untuk menyediakan layanan yang Anda minta. Data yang kami simpan, akan kami lindungi dengan cara yang dapat diterima secara komersial untuk mencegah kehilangan dan pencurian, serta akses, pengungkapan, penyalinan, penggunaan atau modifikasi yang tidak sah.</p><p>Kami tidak membagikan informasi identitas pribadi secara publik atau dengan pihak ketiga, kecuali jika diwajibkan oleh hukum.</p><p>Situs web kami dapat menautkan ke situs eksternal yang tidak dioperasikan oleh kami. Perlu diketahui bahwa kami tidak memiliki kendali atas konten dan praktik situs-situs ini, dan tidak dapat menerima tanggung jawab atas kebijakan privasi masing-masing.</p><p>Anda bebas untuk menolak permintaan kami untuk informasi pribadi Anda, dengan pemahaman bahwa kami mungkin tidak dapat menyediakan beberapa layanan yang Anda inginkan.</p><p>Penggunaan Anda yang berkelanjutan atas situs web kami akan dianggap sebagai penerimaan praktik kami seputar privasi dan informasi pribadi. Jika Anda memiliki pertanyaan tentang bagaimana kami menangani data pengguna dan informasi pribadi, jangan ragu untuk menghubungi kami.</p><p>Kebijakan ini berlaku efektif mulai 7 Juni 2025.</p>`, termsAndConditionsContent: `<h3>Syarat & Ketentuan</h3><p>Selamat datang di NovaAI. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat dengan Syarat dan Ketentuan ini.</p><p>Ketentuan ini berlaku untuk semua pengunjung, pengguna, dan pihak lain yang mengakses atau menggunakan Layanan.</p><p>Dengan mengakses atau menggunakan Layanan, Anda setuju untuk terikat dengan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan, maka Anda tidak boleh mengakses Layanan.</p><h4>Kekayaan Intelektual</h4><p>Layanan dan konten asli, fitur, dan fungsionalitasnya adalah dan akan tetap menjadi milik eksklusif NovaAI dan pemberi lisensinya. Layanan ini dilindungi oleh hak cipta, merek dagang, dan undang-undang lain baik di Indonesia maupun negara asing.</p><p>Layanan kami mungkin berisi tautan ke situs web atau layanan pihak ketiga yang tidak dimiliki atau dikendalikan oleh NovaAI.</p><p>NovaAI tidak memiliki kendali atas, dan tidak bertanggung jawab atas, konten, kebijakan privasi, atau praktik situs web atau layanan pihak ketiga mana pun.</p><p>Kami sangat menyarankan Anda untuk membaca syarat dan ketentuan serta kebijakan privasi situs web atau layanan pihak ketiga mana pun yang Anda kunjungi.</p><p>Dokumen ini terakhir diperbarui pada 7 Juni 2025.</p>`, policyContent: `<h3>Kebijakan</h3><p>Dokumen ini menguraikan kebijakan umum yang mengatur penggunaan layanan NovaAI.</p><p>1. **Penggunaan yang Dapat Diterima:** Pengguna tidak boleh menggunakan NovaAI untuk kegiatan yang melanggar hukum atau dilarang. Ini termasuk, namun tidak terbatas pada, spamming, transmisi kode berbahaya, atau pelanggaran hak kekayaan intelektual.</p><p>2. **Konten:** Pengguna sepenuhnya bertanggung jawab atas konten yang mereka kirimkan melalui NovaAI. NovaAI tidak mendukung atau bertanggung jawab atas konten yang dibuat oleh pengguna.</p><p>3. **Service Availability:** Meskipun kami berusaha untuk ketersediaan 24/7, NovaAI mungkin sementara tidak tersedia karena pemeliharaan, peningkatan, atau masalah teknis yang tidak terduga.</p><p>4. **Modifikasi Layanan:** NovaAI berhak untuk memodifikasi atau menghentikan, sementara atau permanen, Layanan (atau bagian darinya) dengan atau tanpa pemberitahuan.</p><p>Untuk informasi lebih lanjut, silakan lihat Syarat & Ketentuan dan Kebijakan Privasi kami.</p><p>Terakhir dimodifikasi: 7 Juni 2025.</p>`, aboutUsContent: `<h3>Tentang Kami</h3><p>NovaAI adalah asisten AI inovatif yang dirancang untuk menyederhanakan tugas harian Anda dan memberikan informasi yang cepat dan akurat.</p><p>Misi kami adalah membuat AI canggih dapat diakses dan mudah digunakan untuk semua orang. Kami percaya pada kekuatan kecerdasan buatan untuk meningkatkan produktivitas, mendorong pembelajaran, dan memicu kreativitas.</p><p>Developed with a focus on privacy and user experience, NovaAI continuously evolves to meet the needs of our users. We are committed to transparency and providing a reliable service.</p><p>Thank you for choosing NovaAI. We're excited to grow and improve with your feedback.</p><p>Founded: 2025</p>` } };
    function updateTextContent(lang) { /* ... (kode tidak berubah) ... */ document.querySelectorAll('[data-key]').forEach(element => { const key = element.dataset.key; if (translations[lang] && translations[lang][key]) { element.textContent = translations[lang][key]; } }); if (translations[lang] && translations[lang].documentTitle) { docTitle.textContent = translations[lang].documentTitle; } updateQuickSuggestions(lang); }
    function updateQuickSuggestions(lang) { /* ... (kode tidak berubah) ... */ quickCompleteContainer.innerHTML = ''; const suggestions = translations[lang].quickSuggestions; suggestions.forEach(suggestionText => { const button = document.createElement('button'); button.classList.add('quick-complete-btn'); button.textContent = suggestionText; button.addEventListener('click', () => { if (currentActivePage === 'welcome') { showPage('chat', suggestionText); } else { addChatMessage(suggestionText, 'user'); generateRealAIResponse(suggestionText, selectedModel); } messageInput.value = ''; autoResizeTextarea(); messageInput.focus(); clearInterval(placeholderInterval); quickCompleteContainer.classList.remove('active'); }); quickCompleteContainer.appendChild(button); }); if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') { quickCompleteContainer.classList.add('active'); } }
    languageSelect.value = currentLanguage;
    updateTextContent(currentLanguage);
    languageSelect.addEventListener('change', (event) => { currentLanguage = event.target.value; localStorage.setItem('novaai_language', currentLanguage); updateTextContent(currentLanguage); animatePlaceholder(); if (recognition) { recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; } });

    function openModal(titleKey, contentKey) { modalTitle.textContent = translations[currentLanguage][titleKey]; modalBody.innerHTML = translations[currentLanguage][contentKey]; infoModalOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeModal() { infoModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
    modalCloseBtn.addEventListener('click', closeModal);
    infoModalOverlay.addEventListener('click', (e) => { if (e.target === infoModalOverlay) { closeModal(); } });
    document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(item => { item.addEventListener('click', function (e) { e.preventDefault(); sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); const targetKey = this.dataset.modalTarget; const titleKey = targetKey; const contentKey = targetKey + 'Content'; openModal(titleKey, contentKey); }); });

    function setupRippleEffects() { /* ... (kode tidak berubah) ... */ const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .model-select-container'); clickableElements.forEach(element => { const oldHandler = element._rippleHandler; if (oldHandler) { element.removeEventListener('click', oldHandler); } const newHandler = function (e) { const ripple = document.createElement('span'); ripple.classList.add('ripple'); this.appendChild(ripple); const rect = this.getBoundingClientRect(); const size = Math.max(rect.width, rect.height); const x = e.clientX - rect.left - (size / 2); const y = e.clientY - rect.top - (size / 2); ripple.style.width = ripple.style.height = `${size}px`; ripple.style.left = `${x}px`; ripple.style.top = `${y}px`; ripple.addEventListener('animationend', () => { ripple.remove(); }); }; element.addEventListener('click', newHandler); element._rippleHandler = newHandler; }); }
    setupRippleEffects();
    const observer = new MutationObserver((mutations) => { /* ... (kode tidak berubah) ... */ mutations.forEach((mutation) => { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { const newActionButtons = Array.from(mutation.addedNodes).some(node => node.querySelector && node.querySelector('.ai-action-btn')); const newCodeBlocks = Array.from(mutation.addedNodes).some(node => node.querySelector && node.querySelector('.copy-code-btn')); if (newActionButtons || newCodeBlocks) { setupRippleEffects(); } } }); });
    observer.observe(chatHistory, { childList: true, subtree: true });

    modelSelectContainer.addEventListener('click', (event) => { /* ... (kode tidak berubah) ... */ event.stopPropagation(); modelSelect.classList.toggle('hidden'); modelSelectContainer.classList.toggle('open'); if (!modelSelect.classList.contains('hidden')) { modelSelect.focus(); const option = modelSelect.querySelector(`option[value="${modelSelect.value}"]`); if (option) { option.selected = true; } } });
    modelSelect.addEventListener('change', (event) => { /* ... (kode tidak berubah) ... */ selectedModel = event.target.value; selectedModelDisplay.textContent = selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1); console.log(`Model changed to: ${selectedModel}`); modelSelect.classList.add('hidden'); modelSelectContainer.classList.remove('open'); });
    document.addEventListener('click', (event) => { /* ... (kode tidak berubah) ... */ if (!modelSelectContainer.contains(event.target)) { modelSelect.classList.add('hidden'); modelSelectContainer.classList.remove('open'); } });

    function updateInputAreaPadding() { /* ... (kode tidak berubah) ... */ const inputWrapperHeight = inputWrapper.offsetHeight; const attachedFilesHeight = attachedFilesContainer.offsetHeight; const attachedFilesIsVisible = attachedFilesContainer.children.length > 0; const fileContainerActualHeight = attachedFilesIsVisible ? attachedFilesHeight + 10 : 0; const totalBottomSpace = inputWrapperHeight + 15 + fileContainerActualHeight; mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; chatHistory.scrollTop = chatHistory.scrollHeight; }

    plusButton.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (event) => { /* ... (kode tidak berubah) ... */ const files = event.target.files; if (files.length > 0) { Array.from(files).forEach(file => { if (file.size > MAX_FILE_SIZE_BYTES) { alert(`File "${file.name}" (${(file.size / 1024).toFixed(2)} KB) melebihi ukuran maksimum ${MAX_FILE_SIZE_KB} KB.`); } else { const isDuplicate = attachedFiles.some(f => f.name === file.name && f.size === file.size); if (!isDuplicate) { attachedFiles.push(file); displayAttachedFile(file); } else { alert(`File "${file.name}" sudah dilampirkan.`); } } }); fileInput.value = ''; quickCompleteContainer.classList.remove('active'); updateInputAreaPadding(); } });
    function displayAttachedFile(file) { /* ... (kode tidak berubah) ... */ const fileItem = document.createElement('div'); fileItem.classList.add('attached-file-item'); fileItem.dataset.fileName = file.name; fileItem.dataset.fileSize = file.size; const fileInfo = document.createElement('div'); fileInfo.classList.add('file-info'); fileInfo.innerHTML = `<span class="file-name">${file.name}</span><span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>`; fileItem.appendChild(fileInfo); const removeButton = document.createElement('button'); removeButton.classList.add('remove-file-btn'); removeButton.innerHTML = '×'; removeButton.title = `Hapus ${file.name}`; removeButton.addEventListener('click', () => { removeAttachedFile(file.name, file.size); }); fileItem.appendChild(removeButton); attachedFilesContainer.appendChild(fileItem); updateInputAreaPadding(); }
    function removeAttachedFile(fileName, fileSize) { /* ... (kode tidak berubah) ... */ attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSize)); const fileItemToRemove = document.querySelector(`.attached-file-item[data-file-name="${fileName}"][data-file-size="${fileSize}"]`); if (fileItemToRemove) { fileItemToRemove.remove(); } if (attachedFiles.length === 0 && messageInput.value.trim() === '' && currentActivePage === 'welcome') { quickCompleteContainer.classList.add('active'); } updateInputAreaPadding(); }
    function clearAttachedFiles() { /* ... (kode tidak berubah) ... */ attachedFiles = []; attachedFilesContainer.innerHTML = ''; updateInputAreaPadding(); if (messageInput.value.trim() === '' && currentActivePage === 'welcome') { quickCompleteContainer.classList.add('active'); } }

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) { /* ... (kode tidak berubah) ... */ const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; recognition = new SpeechRecognition(); recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; recognition.continuous = false; recognition.interimResults = true; let finalTranscript = ''; recognition.onstart = () => { console.log('Voice recognition started.'); voiceInputButton.style.backgroundColor = 'red'; messageInput.placeholder = 'Listening...'; }; recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); }; recognition.onend = () => { console.log('Voice recognition ended.'); voiceInputButton.style.backgroundColor = ''; if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); sendButton.click(); } messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex]; finalTranscript = ''; }; recognition.onerror = (event) => { console.error('Speech recognition error:', event.error); voiceInputButton.style.backgroundColor = ''; messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex]; finalTranscript = ''; alert('Speech recognition error: ' + event.error); }; voiceInputButton.addEventListener('click', () => { try { recognition.start(); } catch (e) { console.warn('Recognition already started or other error:', e); recognition.stop(); } }); } else { voiceInputButton.style.display = 'none'; console.warn('Web Speech API not supported in this browser.'); }
    showPage(currentActivePage);
});

// Tambahkan fungsi ini di luar event listener DOMContentLoaded agar bisa diakses oleh onclick
function copyCode(buttonElement) {
    const pre = buttonElement.closest('.code-block').querySelector('pre');
    navigator.clipboard.writeText(pre.textContent).then(() => {
        const span = buttonElement.querySelector('span');
        span.textContent = 'Copied!';
        setTimeout(() => {
            span.textContent = 'Copy';
        }, 2000);
    });
}