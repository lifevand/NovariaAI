// === GANTI SELURUH ISI SCRIPT.JS ANDA DENGAN KODE INI ===

document.addEventListener('DOMContentLoaded', () => {
    // === AWAL: PENGECEKAN LOGIN & INISIALISASI GOOGLE ===
    let currentUser = null;
    let googleAuth = null;

    function initGoogleAuth() {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: "870787988649-sj4pcmpa5t6ms6a1kgvsmvsc1tuh1ngu.apps.googleusercontent.com",
                callback: handleCredentialResponse,
                auto_select: true, // Coba auto-login jika user pernah login
                ux_mode: "popup" // Menggunakan popup untuk login
            });
            // Cek status login saat load
            const storedUser = localStorage.getItem('novaUser');
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    if (currentUser && currentUser.name) {
                        updateLoginUI(true);
                        document.body.classList.remove('app-hidden');
                        document.body.classList.add('app-loaded');
                    } else {
                        handleLogout(); // Data user tidak valid
                    }
                } catch (e) {
                    console.error("Error parsing stored user data:", e);
                    handleLogout();
                }
            } else {
                 // Tidak ada user di localStorage, tampilkan tombol login
                updateLoginUI(false);
                // Jika tidak ada user tersimpan, redirect ke login.html
                // Ini bisa diubah jika ingin user bisa akses app tanpa login,
                // tapi desain sidebar mengindikasikan login adalah fitur utama.
                // window.location.href = 'login.html';
                // return;
                document.body.classList.remove('app-hidden');
                document.body.classList.add('app-loaded');
            }
        } else {
            console.error("Google Identity Services library not loaded.");
            // Mungkin tampilkan pesan error ke user atau coba load ulang
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded'); // Tetap tampilkan app, tapi login Google mungkin gagal
            updateLoginUI(false);
        }
    }

    function handleCredentialResponse(response) {
        // Decode JWT token untuk mendapatkan info user
        const decodedToken = jwt_decode(response.credential);
        currentUser = {
            id: decodedToken.sub,
            name: decodedToken.name,
            givenName: decodedToken.given_name,
            familyName: decodedToken.family_name,
            email: decodedToken.email,
            picture: decodedToken.picture
        };
        localStorage.setItem('novaUser', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        updateLoginUI(true);
        personalizeWelcomeMessage();
    }

    function jwt_decode(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            console.error("Error decoding JWT", e);
            return null;
        }
    }

    function updateLoginUI(isLoggedIn) {
        const userInfoDisplay = document.getElementById('userInfoDisplay');
        const googleSignInButton = document.getElementById('googleSignInButton');
        const logoutButton = document.getElementById('logoutButton');

        if (isLoggedIn && currentUser) {
            document.getElementById('userProfilePic').src = currentUser.picture || 'logo.png'; // Fallback ke logo jika pic tidak ada
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
            userInfoDisplay.classList.remove('hidden');
            googleSignInButton.classList.add('hidden');
        } else {
            userInfoDisplay.classList.add('hidden');
            googleSignInButton.classList.remove('hidden');
        }
    }

    function handleLogout() {
        if (google && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect(); // Hentikan auto-login di sesi berikutnya
        }
        localStorage.removeItem('novaUser');
        localStorage.removeItem('isLoggedIn');
        currentUser = null;
        updateLoginUI(false);
        personalizeWelcomeMessage(); // Kembali ke pesan welcome default
        // Opsional: Redirect ke halaman login setelah logout
        // window.location.href = 'login.html';
    }
    // === AKHIR: PENGECEKAN LOGIN & INISIALISASI GOOGLE ===


    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarIcon = document.getElementById('closeSidebarIcon');
    const deleteAllChatsIcon = document.getElementById('deleteAllChatsIcon');
    const chatHistoryList = document.getElementById('chatHistoryList');

    const homeIcon = document.getElementById('homeIcon');
    const newChatIcon = document.getElementById('newChatIcon');

    const modelSelectorContainer = document.getElementById('modelSelectorContainer');
    let selectedModel = 'gemini-2.0-flash'; // Model default

    const chatHistory = document.getElementById('chatHistory');
    const thinkingIndicator = document.getElementById('thinkingIndicator');

    const welcomeSection = document.getElementById('welcomeSection');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const chatSection = document.getElementById('chatSection');
    const mainContent = document.querySelector('main');
    const bottomContainer = document.querySelector('.bottom-container');

    let currentActivePage = 'welcome'; // Bisa 'welcome' atau 'chat'

    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    // fileChipContainer tidak digunakan lagi secara visual

    const MAX_FILE_SIZE_KB_NEW = 450;
    const MAX_FILE_SIZE_BYTES_NEW = MAX_FILE_SIZE_KB_NEW * 1024;
    const MAX_FILES_ALLOWED = 5;
    let attachedFiles = []; // Tetap simpan file yang di-attach

    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition;


    // Inisialisasi Google Auth setelah DOM siap
    if (typeof google !== 'undefined' && google.accounts) {
       initGoogleAuth();
    } else {
        // Jika Google SDK belum siap, coba tunggu sebentar
        const gsiScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (gsiScript) {
            gsiScript.onload = initGoogleAuth;
        } else {
            console.error("Google Sign-In SDK script not found.");
            // Fallback jika script tidak ada, tampilkan app tanpa login Google
            document.body.classList.remove('app-hidden');
            document.body.classList.add('app-loaded');
            updateLoginUI(false);
        }
    }


    const googleSignInButton = document.getElementById('googleSignInButton');
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', () => {
            if (google && google.accounts && google.accounts.id) {
                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Handle jika prompt tidak tampil (misal karena pop-up blocker)
                        console.warn("Google Sign-In prompt was not displayed or skipped.");
                    }
                });
            } else {
                alert("Google Sign-In is not available at the moment. Please try again later.");
            }
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    function personalizeWelcomeMessage() {
        if (currentUser && currentUser.givenName) {
            welcomeSubtitle.textContent = `Hii, ${currentUser.givenName}, I Can Help You?`;
        } else if (currentUser && currentUser.name) {
            welcomeSubtitle.textContent = `Hii, ${currentUser.name.split(' ')[0]}, I Can Help You?`;
        } else {
            welcomeSubtitle.textContent = "Hii, I Can Help You?";
        }
    }
    personalizeWelcomeMessage(); // Panggil saat load

    function checkScrollable() {
        setTimeout(() => {
            if (!chatHistory) return;
            const isScrollable = chatHistory.scrollHeight > chatHistory.clientHeight;
            const isAtBottom = chatHistory.scrollHeight - chatHistory.scrollTop <= chatHistory.clientHeight + 5; // Toleransi 5px
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

    function showPage(pageName, initialMessage = null, options = { isNewChat: false }) {
        const isSwitchingToChat = pageName === 'chat';
        const isSwitchingToWelcome = pageName === 'welcome';

        if (currentActivePage === pageName && !initialMessage && !options.isNewChat) return;

        if (options.isNewChat && pageName === 'chat') {
            chatHistory.innerHTML = ''; // Kosongkan chat history
             // Sisipkan kembali thinking indicator yang mungkin terhapus
            const newThinkingIndicator = document.createElement('div');
            newThinkingIndicator.id = 'thinkingIndicator';
            newThinkingIndicator.classList.add('ai-message', 'hidden');
            newThinkingIndicator.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
            chatHistory.appendChild(newThinkingIndicator); // thinkingIndicator direferensikan ulang nanti
            window.thinkingIndicator = document.getElementById('thinkingIndicator'); // Update referensi global jika perlu
        }


        welcomeSection.classList.toggle('active', isSwitchingToWelcome);
        welcomeSection.classList.toggle('hidden', !isSwitchingToWelcome);
        chatSection.classList.toggle('active', isSwitchingToChat);
        chatSection.classList.toggle('hidden', !isSwitchingToChat);

        currentActivePage = pageName;

        if (isSwitchingToChat) {
            setTimeout(() => {
                if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
                checkScrollable();
                messageInput.focus();
            }, 10);
        } else { // Switching to Welcome
            personalizeWelcomeMessage(); // Pastikan pesan welcome terpersonalisasi
        }

        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, attachedFiles, selectedModel);
        }
        updateInputAreaAppearance();
        loadChatHistoryList(); // Muat ulang history list di sidebar
    }

    const placeholders_en = ["Ask me anything...", "What's on your mind?", "Let's talk about something...", "How can I assist you today?", "Start typing your query..."];
    let currentPlaceholderIndex = 0;
    function animatePlaceholder() {
        if (messageInput.value.trim() !== '') return;
        // Animasi placeholder sederhana tanpa transform
        currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders_en.length;
        messageInput.placeholder = placeholders_en[currentPlaceholderIndex];
    }
    let placeholderInterval = setInterval(animatePlaceholder, 3500);
    animatePlaceholder();
    messageInput.addEventListener('focus', () => clearInterval(placeholderInterval));
    messageInput.addEventListener('blur', () => { if (messageInput.value.trim() === '') { placeholderInterval = setInterval(animatePlaceholder, 3500); }});
    messageInput.addEventListener('input', autoResizeTextarea);

    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 100; // Max tinggi textarea sebelum scroll
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        updateInputAreaAppearance();
    }
    autoResizeTextarea();

    function addChatMessage(content, sender = 'user', modelUsed = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0'; // Untuk animasi fade-in
        // transform: translateY(15px) dihapus, animasi sederhana saja

        if (sender === 'user') {
            messageElement.textContent = content;
        } else {
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');

            const aiLogoImg = document.createElement('img');
            aiLogoImg.src = 'logo.png'; // Pastikan logo.png ada
            aiLogoImg.alt = 'Novaria Logo';
            aiLogoImg.classList.add('ai-logo');
            aiHeader.appendChild(aiLogoImg);

            const aiNameSpan = document.createElement('span');
            aiNameSpan.classList.add('ai-name');
            aiNameSpan.textContent = 'Novaria';
            aiHeader.appendChild(aiNameSpan);

            if (modelUsed) {
                const aiModelTagSpan = document.createElement('span');
                aiModelTagSpan.classList.add('ai-model-tag');
                aiModelTagSpan.textContent = modelUsed;
                aiHeader.appendChild(aiModelTagSpan);
            }
            messageElement.appendChild(aiHeader);

            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            aiContentContainer.innerHTML = content; // Content sudah di-sanitize dan bisa berisi HTML (misal code block)
            messageElement.appendChild(aiContentContainer);
        }

        const currentThinkingIndicator = document.getElementById('thinkingIndicator'); // Selalu ambil yang terbaru
        if (chatHistory && currentThinkingIndicator) {
            chatHistory.insertBefore(messageElement, currentThinkingIndicator);
        } else if (chatHistory) {
            chatHistory.appendChild(messageElement);
        }

        setTimeout(() => { // Animasi fade-in
            messageElement.style.opacity = '1';
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

        // Fungsi getResponseText dan getFullContent (dari kode Anda sebelumnya, sedikit disesuaikan)
        const getResponseText = (contentEl) => { /* ... (sama seperti sebelumnya) ... */ return contentEl.textContent || "";};
        const getFullContent = (contentEl) => { /* ... (sama seperti sebelumnya) ... */ return contentEl.innerHTML || "";};


        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl) => { const fullContent = getFullContent(contentContainer); navigator.clipboard.writeText(contentContainer.textContent || "").then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => console.error('Failed to copy: ', err)); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl) => { const textToSpeak = getResponseText(contentContainer); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" stroke="#3b82f6" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            // Regenerate disederhanakan: Mengambil pesan user terakhir dari UI
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const userMessages = Array.from(chatHistory.querySelectorAll('.user-message')); const lastUserMessage = userMessages.pop(); if (lastUserMessage) { msgEl.remove(); generateRealAIResponse(lastUserMessage.textContent, attachedFiles, selectedModel); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            // Share button (dari kode Anda sebelumnya)
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        contentContainer.appendChild(actionsContainer);
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
        setupRippleEffectsForElement(actionsContainer); // Tambahkan ripple effect ke tombol baru
    }

    async function generateRealAIResponse(userMessage, files = [], modelName) {
        const currentThinkingIndicator = document.getElementById('thinkingIndicator');
        if (currentThinkingIndicator) {
            currentThinkingIndicator.classList.remove('hidden');
            currentThinkingIndicator.style.opacity = '1';
        }
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; checkScrollable(); }, 0);

        try {
            const payload = { userMessage: userMessage, model: modelName };
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
            const rawAiResponseText = data.text;

            if (currentThinkingIndicator) currentThinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (currentThinkingIndicator) currentThinkingIndicator.classList.add('hidden');

                let personalizedResponseText = rawAiResponseText;
                if (currentUser && currentUser.givenName) { // Sapaan jika sudah login
                    // personalizedResponseText = `Okay ${currentUser.givenName}, here's what I found:\n\n` + rawAiResponseText;
                }

                // Parsing Markdown dan Code Blocks (dari kode Anda sebelumnya, sedikit disesuaikan)
                let finalHtmlContent = '';
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let lastIndex = 0;
                personalizedResponseText.replace(codeBlockRegex, (match, language, code, offset) => {
                    const plainText = personalizedResponseText.substring(lastIndex, offset);
                    finalHtmlContent += `<span>${plainText.replace(/</g, "<").replace(/>/g, ">")}</span>`; // Basic sanitizing
                    const lang = language || 'text';
                    const codeHtml = `<div class="code-block"><div class="code-header"><span class="language-tag">${lang}</span><button class="copy-code-btn" title="Copy code" onclick="copyCode(this)"><svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect height="8" width="8" x="8" y="2"/></svg><span>Copy</span></button></div><pre>${code.trim().replace(/</g, "<").replace(/>/g, ">")}</pre></div>`;
                    finalHtmlContent += codeHtml;
                    lastIndex = offset + match.length;
                });
                const remainingText = personalizedResponseText.substring(lastIndex);
                if (remainingText) {
                    finalHtmlContent += `<span>${remainingText.replace(/</g, "<").replace(/>/g, ">")}</span>`;
                }

                const aiMessageElement = addChatMessage(finalHtmlContent, 'ai', modelName);
                addAiMessageActions(aiMessageElement);
                clearAttachedFiles();
                checkScrollable();
                saveCurrentChatToHistory(userMessage, finalHtmlContent, modelName); // Simpan chat ke history
            }, 300);

        } catch (error) {
            console.error('Error fetching from /api/generate:', error);
            if (currentThinkingIndicator) currentThinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (currentThinkingIndicator) currentThinkingIndicator.classList.add('hidden');
                addChatMessage(`<span>Maaf, terjadi kesalahan: ${error.message}. Coba lagi nanti.</span>`, 'ai', modelName);
            }, 300);
        }
    }

    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message !== '' || attachedFiles.length > 0) {
            let finalPrompt = message;
            // ... (logika finalPrompt dengan file seperti sebelumnya) ...
             if (attachedFiles.length > 0 && message === '') {
                finalPrompt = `Analyze these files: ${attachedFiles.map(f => f.name).join(', ')}`;
            } else if (attachedFiles.length > 0) {
                finalPrompt = `${message} (Attached: ${attachedFiles.map(f => f.name).join(', ')})`;
            }

            if (currentActivePage === 'welcome') {
                showPage('chat', finalPrompt);
            } else {
                addChatMessage(finalPrompt, 'user');
                generateRealAIResponse(finalPrompt, attachedFiles, selectedModel);
            }
            messageInput.value = '';
            autoResizeTextarea();
        }
    });
    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

    // === Navigasi Header ===
    homeIcon.addEventListener('click', () => { window.location.href = 'login.html'; });
    newChatIcon.addEventListener('click', () => {
        showPage('chat', null, { isNewChat: true }); // Buka halaman chat dengan kondisi baru
        clearAttachedFiles();
        messageInput.value = '';
        autoResizeTextarea();
        // Reset ke model default jika perlu
        // selectModel(document.querySelector('.model-select-btn[data-model="gemini-2.0-flash"]'));
    });

    // === Sidebar Logic ===
    menuIcon.addEventListener('click', () => { sidebar.classList.add('active'); sidebarOverlay.classList.add('active'); loadChatHistoryList(); });
    sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); });
    closeSidebarIcon.addEventListener('click', () => { sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); });

    // === Model Selection ===
    modelSelectorContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.model-select-btn');
        if (button) {
            selectModel(button);
        }
    });

    function selectModel(buttonElement) {
        document.querySelectorAll('.model-select-btn').forEach(btn => btn.classList.remove('active'));
        buttonElement.classList.add('active');
        selectedModel = buttonElement.dataset.model;
        // console.log("Selected model:", selectedModel);
    }
    // Set model default aktif saat load
    selectModel(document.querySelector(`.model-select-btn[data-model="${selectedModel}"]`));


    // === File Attachment Logic (tanpa chip UI) ===
    plusButton.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (event) => {
        const filesToProcess = Array.from(event.target.files);
        if (filesToProcess.length === 0) return;
        // ... (validasi ukuran dan duplikasi file seperti sebelumnya) ...
        let canAddCount = MAX_FILES_ALLOWED - attachedFiles.length;
        if (canAddCount <= 0) {
            alert(`Max ${MAX_FILES_ALLOWED} files.`);
            fileInput.value = ''; return;
        }
        const newValidFiles = [];
        for (const file of filesToProcess) {
            if (newValidFiles.length >= canAddCount) { alert(`Only ${canAddCount} more files.`); break; }
            if (file.size > MAX_FILE_SIZE_BYTES_NEW) { alert(`File ${file.name} too large.`); continue; }
            if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) { alert(`File ${file.name} already attached.`); continue; }
            newValidFiles.push(file);
        }
        attachedFiles.push(...newValidFiles);
        // Tidak ada displayFileChipItem() lagi
        fileInput.value = '';
        if (attachedFiles.length > 0) {
             // Beri indikasi visual sederhana bahwa file terlampir, misal ubah ikon plus atau tambahkan badge
            plusButton.classList.add('has-files'); // Anda perlu styling untuk .has-files
            plusButton.title = `${attachedFiles.length} file(s) attached`;
        }
    });

    function clearAttachedFiles() {
        attachedFiles = [];
        plusButton.classList.remove('has-files');
        plusButton.title = "Attach files";
        // Tidak ada fileChipContainer.innerHTML = '';
        updateInputAreaAppearance();
    }


    // === Chat History Management ===
    const CHAT_HISTORY_KEY = 'novaAiChatHistory';
    let chatSessions = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY)) || [];

    function saveCurrentChatToHistory(firstUserMessage, lastAiResponseHTML, model) {
        // Hanya simpan jika ada pesan user
        if (!firstUserMessage || firstUserMessage.trim() === "") return;

        // Ambil semua pesan dari chat saat ini
        const currentMessages = [];
        chatHistory.querySelectorAll('.chat-message').forEach(msgEl => {
            let sender = msgEl.classList.contains('user-message') ? 'user' : 'ai';
            let content = "";
            if (sender === 'user') {
                content = msgEl.textContent;
            } else {
                const contentEl = msgEl.querySelector('.ai-message-content');
                if (contentEl) content = contentEl.innerHTML; // Simpan HTML untuk AI agar code block terjaga
            }
            const modelTagEl = msgEl.querySelector('.ai-model-tag');
            const modelUsedInMessage = modelTagEl ? modelTagEl.textContent : (sender === 'ai' ? model : null);

            if (content) { // Hanya simpan jika ada konten
                 currentMessages.push({ sender, content, model: modelUsedInMessage });
            }
        });

        if (currentMessages.length === 0) return;


        const newSession = {
            id: Date.now(),
            title: firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? "..." : ""),
            messages: currentMessages, // Simpan semua pesan dalam sesi
            timestamp: new Date().toISOString(),
            modelUsed: model // Model utama yang digunakan untuk memulai/generasi terakhir
        };
        chatSessions.unshift(newSession); // Tambah ke awal array
        if (chatSessions.length > 20) chatSessions.pop(); // Batasi jumlah history
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatSessions));
        loadChatHistoryList();
    }

    function loadChatHistoryList() {
        chatHistoryList.innerHTML = ''; // Kosongkan list dulu
        chatSessions = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY)) || [];
        chatSessions.forEach(session => {
            const li = document.createElement('li');
            li.classList.add('history-item');
            li.dataset.chatId = session.id;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = session.title;
            li.appendChild(titleSpan);

            const optionsButton = document.createElement('button');
            optionsButton.classList.add('history-item-options', 'icon-btn-sidebar');
            optionsButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>`;
            optionsButton.title = "Options";
            optionsButton.onclick = (e) => {
                e.stopPropagation();
                // Tampilkan menu custom atau langsung hapus (untuk simpel)
                if (confirm(`Delete chat "${session.title}"?`)) {
                    deleteChatSession(session.id);
                }
            };
            li.appendChild(optionsButton);

            li.onclick = () => {
                loadChatSession(session.id);
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            };
            chatHistoryList.appendChild(li);
        });
        setupRippleEffectsForElement(chatHistoryList);
    }

    function loadChatSession(sessionId) {
        const session = chatSessions.find(s => s.id === sessionId);
        if (session) {
            showPage('chat', null, { isNewChat: true }); // Reset UI chat
            chatHistory.innerHTML = ''; // Pastikan bersih
            const newThinkingIndicator = document.createElement('div'); // Tambah thinking indicator lagi
            newThinkingIndicator.id = 'thinkingIndicator';
            newThinkingIndicator.classList.add('ai-message', 'hidden');
            newThinkingIndicator.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
            chatHistory.appendChild(newThinkingIndicator);
            window.thinkingIndicator = document.getElementById('thinkingIndicator');


            session.messages.forEach(msg => {
                const msgEl = addChatMessage(msg.content, msg.sender, msg.model);
                if (msg.sender === 'ai') {
                    addAiMessageActions(msgEl);
                }
            });
            // Atur model aktif sesuai sesi yang di-load jika ada
            if (session.modelUsed) {
                const modelBtn = document.querySelector(`.model-select-btn[data-model="${session.modelUsed}"]`);
                if (modelBtn) selectModel(modelBtn);
            }
            setTimeout(() => { chatHistory.scrollTop = chatHistory.scrollHeight; checkScrollable(); }, 100);
        }
    }

    function deleteChatSession(sessionId) {
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatSessions));
        loadChatHistoryList();
        // Jika chat yang aktif dihapus, reset ke welcome atau new chat
        if (chatHistory.querySelectorAll('.chat-message').length > 0) { // Cek apakah ada chat aktif
            // Heuristik: Jika judul chat yang dihapus ada di pesan pertama user, maka reset
            const firstUserMsgEl = chatHistory.querySelector('.user-message');
            if (firstUserMsgEl) {
                const session = (JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY)) || []).find(s => s.id === sessionId); // ambil lagi untuk title
                 // Jika tidak ada session lagi, atau session yang dihapus adalah yang aktif
                 // (ini perlu cara yang lebih baik untuk menandai sesi aktif)
                 // Untuk sementara, jika chat dihapus, kembali ke welcome
                showPage('welcome', null, {isNewChat: true});

            }
        }
    }

    deleteAllChatsIcon.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
            chatSessions = [];
            localStorage.removeItem(CHAT_HISTORY_KEY);
            loadChatHistoryList();
            showPage('welcome', null, {isNewChat: true}); // Kembali ke welcome setelah semua dihapus
        }
    });


    // === Voice Input ===
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';
        recognition.onstart = () => { voiceInputButton.classList.add('recording'); messageInput.placeholder = 'Listening...'; };
        recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); };
        recognition.onend = () => { voiceInputButton.classList.remove('recording'); if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); } if (messageInput.value.trim() === '') { messageInput.placeholder = placeholders_en[currentPlaceholderIndex]; } finalTranscript = ''; };
        recognition.onerror = (event) => { voiceInputButton.classList.remove('recording'); messageInput.placeholder = placeholders_en[currentPlaceholderIndex]; finalTranscript = ''; console.error('Speech recognition error: ', event.error); };
        voiceInputButton.addEventListener('click', () => { try { if (recognition && typeof recognition.stop === 'function' && voiceInputButton.classList.contains('recording') /* Cek status dari class */) { recognition.stop(); } else { recognition.start(); } } catch (e) { if (recognition && typeof recognition.stop === 'function') recognition.stop(); voiceInputButton.classList.remove('recording'); } });
    } else {
        voiceInputButton.style.display = 'none';
    }


    function updateInputAreaAppearance() {
        const bottomContainerHeight = bottomContainer.offsetHeight;
        mainContent.style.paddingBottom = `${bottomContainerHeight + 10}px`; // +10px untuk spasi tambahan
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    // Initial setup
    showPage('welcome'); // Mulai dari welcome screen
    loadChatHistoryList(); // Muat history saat pertama kali
    updateInputAreaAppearance(); // Panggil sekali untuk set padding awal
    window.addEventListener('resize', updateInputAreaAppearance); // Update saat resize

    // === Ripple Effects (dari kode Anda, sedikit dimodifikasi) ===
    function setupRippleEffectsForElement(parentElement) {
        const clickableElements = parentElement.querySelectorAll('.btn-circle, .icon-btn, .icon-btn-sidebar, .sidebar-item, .model-select-btn, .ai-action-btn, .copy-code-btn, .history-item, .google-signin-btn');
        clickableElements.forEach(element => {
            // Hapus event listener lama jika ada untuk mencegah duplikasi
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }

            const newHandler = function (e) {
                // Jangan jalankan ripple jika target adalah input/select/textarea atau di dalam select
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('select')) {
                    return;
                }
                 // Cek jika tombol options di history item yang di-klik, ripple jangan ke parent li
                if (this.classList.contains('history-item') && e.target.closest('.history-item-options')) {
                    return;
                }


                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                this.appendChild(ripple); // Append ke elemen yang diklik

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
            element._rippleHandler = newHandler; // Simpan handler untuk bisa dihapus nanti
        });
    }
    setupRippleEffectsForElement(document.body); // Panggil untuk elemen yang sudah ada
    // Observer untuk elemen dinamis (seperti pesan AI atau item history)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Hanya elemen node
                         // Jika node itu sendiri adalah elemen yang butuh ripple atau mengandungnya
                        if (node.matches && (node.matches('.ai-action-btn, .copy-code-btn, .history-item') || node.querySelector('.ai-action-btn, .copy-code-btn'))) {
                            setupRippleEffectsForElement(node);
                        }
                    }
                });
            }
        });
    });
    if (chatHistory) observer.observe(chatHistory, { childList: true, subtree: true });
    if (chatHistoryList) observer.observe(chatHistoryList, { childList: true, subtree: true });


}); // Akhir DOMContentLoaded

// Fungsi global (jika masih dibutuhkan di luar scope DOMContentLoaded)
function copyCode(buttonElement) {
    const pre = buttonElement.closest('.code-block').querySelector('pre');
    navigator.clipboard.writeText(pre.textContent)
        .then(() => {
            const span = buttonElement.querySelector('span');
            const originalText = span.textContent;
            span.textContent = 'Copied!';
            setTimeout(() => { span.textContent = originalText; }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy code: ', err);
            const span = buttonElement.querySelector('span');
            span.textContent = 'Error!';
            setTimeout(() => { span.textContent = 'Copy'; }, 2000);
        });
}
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}