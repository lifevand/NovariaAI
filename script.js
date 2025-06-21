// script.js (Untuk index.html - Dimodifikasi untuk handle errorType dari Hugging Face backend)

document.addEventListener('DOMContentLoaded', () => {
    // === AWAL: PENGECEKAN LOGIN ===
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser'); // Pastikan key ini konsisten
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
            console.error("SCRIPT.JS: Error parsing user data or invalid data:", e);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('novaUser'); // Pastikan key ini konsisten
            window.location.href = 'login.html';
            return;
        }
    } else {
        window.location.href = 'login.html';
        return;
    }
    // === AKHIR: PENGECEKAN LOGIN ===

    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const menuIcon = document.getElementById('menuIcon');
    const backIcon = document.getElementById('backIcon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const themeToggleLanding = document.getElementById('themeToggleLanding');
    // const quickCompleteContainer = document.getElementById('quickCompleteContainer'); // Dikomentari karena tidak dipakai
    const chatHistory = document.getElementById('chatHistory');
    const thinkingIndicator = document.getElementById('thinkingIndicator');

    const welcomeSection = document.getElementById('welcomeSection');
    const chatSection = document.getElementById('chatSection');
    const landingThemeToggleContainer = document.getElementById('landingThemeToggleContainer');
    const mainContent = document.querySelector('main');

    let currentActivePage = 'welcome';

    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    const inputWrapper = document.querySelector('.input-wrapper'); // Pastikan elemen ini ada

    const MAX_FILE_SIZE_KB_NEW = 450;
    const MAX_FILE_SIZE_BYTES_NEW = MAX_FILE_SIZE_KB_NEW * 1024;
    const MAX_FILES_ALLOWED = 5;
    const fileChipContainer = document.getElementById('fileChipContainer');
    let attachedFiles = [];

    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition;


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
            if(landingThemeToggleContainer) landingThemeToggleContainer.classList.add('hidden');
            if(menuIcon) menuIcon.classList.add('hidden');
            if(backIcon) backIcon.classList.remove('hidden');
            setTimeout(() => {
                if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
                checkScrollable();
            }, 10);
            // if(quickCompleteContainer) quickCompleteContainer.classList.remove('active');
        } else { // Welcome page
            if(landingThemeToggleContainer) landingThemeToggleContainer.classList.remove('hidden');
            if(menuIcon) menuIcon.classList.remove('hidden');
            if(backIcon) backIcon.classList.add('hidden');
            // if (quickCompleteContainer && messageInput && messageInput.value.trim() === '' && attachedFiles.length === 0) {
            //     quickCompleteContainer.classList.add('active');
            // }
        }
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, attachedFiles);
        }
        if(typeof updateInputAreaAppearance === "function") updateInputAreaAppearance();
    }

    const placeholders_en = ["Ask me anything...","What's on your mind?","Tell me a story...","How can I help you today?","Start a conversation...","I'm ready to chat!","Let's explore together...","What do you want to learn?"];
    let currentPlaceholderIndex = 0;
    function animatePlaceholder() {
        if (!messageInput || messageInput.value.trim() !== '') return;
        messageInput.style.opacity = '0';
        messageInput.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders_en.length;
            messageInput.placeholder = placeholders_en[currentPlaceholderIndex];
            messageInput.style.opacity = '1';
            messageInput.style.transform = 'translateY(0)';
        }, 500);
    }
    let placeholderInterval;
    if (messageInput) {
        placeholderInterval = setInterval(animatePlaceholder, 3000);
        animatePlaceholder();
        messageInput.addEventListener('focus', () => {
            clearInterval(placeholderInterval);
            // if(quickCompleteContainer) quickCompleteContainer.classList.remove('active');
        });
        messageInput.addEventListener('blur', () => {
            if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                placeholderInterval = setInterval(animatePlaceholder, 3000);
                // if (currentActivePage === 'welcome' && quickCompleteContainer) {
                //     quickCompleteContainer.classList.add('active');
                // }
            }
        });
        messageInput.addEventListener('input', () => {
            // if (quickCompleteContainer) {
            //     if (messageInput.value.trim() !== '' || attachedFiles.length > 0) {
            //         quickCompleteContainer.classList.remove('active');
            //     } else {
            //         if (currentActivePage === 'welcome') {
            //             quickCompleteContainer.classList.add('active');
            //         }
            //     }
            // }
            autoResizeTextarea();
        });
    }


    function autoResizeTextarea() {
        if (!messageInput) return;
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 120;
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        if(typeof updateInputAreaAppearance === "function") updateInputAreaAppearance();
    }
    if (messageInput) {
      messageInput.addEventListener('input', autoResizeTextarea);
      autoResizeTextarea();
    }


    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """).replace(/'/g, "'");
    }

    function addChatMessage(content, sender = 'user') {
        if (!chatHistory) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            // Untuk pesan user, cukup set textContent agar aman dari XSS jika content dari user
            messageElement.textContent = content;
        } else { // AI message
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');
            aiHeader.innerHTML = `
                <img src="logo.png" alt="NovaAI Logo" class="ai-logo">
                <span class="ai-name">Novaria</span>
                <span class="ai-model-tag">NovaLLM</span>`; // Nama model generik atau bisa diupdate dari API
            messageElement.appendChild(aiHeader);

            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            // Penting: 'content' dari AI di-set sebagai innerHTML karena bisa mengandung Markdown/HTML
            // Pastikan backend sudah melakukan sanitasi jika diperlukan, atau lakukan di sini.
            // Untuk Markdown, Anda perlu library parser Markdown to HTML.
            // Untuk sekarang, asumsikan content adalah HTML yang aman atau teks biasa.
            let formattedContent = content;
            if (typeof content === 'string') { // Jika hanya string, escape dan wrap dalam span
                 formattedContent = content.replace(/\n/g, '<br>'); // Ganti newline dengan <br> untuk tampilan
                 // Parsing sederhana untuk code blocks jika ada
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let lastIndex = 0;
                let htmlResult = '';
                formattedContent.replace(codeBlockRegex, (match, language, code, offset) => {
                    htmlResult += `<span>${escapeHtml(formattedContent.substring(lastIndex, offset))}</span>`;
                    const lang = language || 'text';
                    htmlResult += `<div class="code-block"><div class="code-header"><span class="language-tag">${escapeHtml(lang)}</span><button class="copy-code-btn" title="Copy code">Copy</button></div><pre>${escapeHtml(code.trim())}</pre></div>`;
                    lastIndex = offset + match.length;
                });
                htmlResult += `<span>${escapeHtml(formattedContent.substring(lastIndex))}</span>`;
                aiContentContainer.innerHTML = htmlResult;
            } else {
                 aiContentContainer.innerHTML = "Format respons tidak didukung."; // Fallback
            }
            messageElement.appendChild(aiContentContainer);
        }

        if (thinkingIndicator) {
            chatHistory.insertBefore(messageElement, thinkingIndicator);
        } else {
            chatHistory.appendChild(messageElement);
        }

        // Tambahkan event listener untuk tombol copy di code block baru
        messageElement.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.onclick = function() { copyCode(this); };
        });


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
        const contentContainer = aiMessageElement.querySelector('.ai-message-content');
        if (!contentContainer || contentContainer.querySelector('.ai-message-actions') || aiMessageElement.classList.contains('user-message')) return;

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

        // ... (Definisi getResponseText dan getFullContent seperti sebelumnya) ...
        const getResponseText = (contentEl) => { /* ... */ };
        const getFullContent = (contentEl) => { /* ... */ };


        const buttons = [
            // ... (Definisi array buttons [copy, speak, like, regenerate, share] seperti sebelumnya) ...
        ];
        buttons.forEach((btnInfo) => { /* ... (pembuatan tombol seperti sebelumnya) ... */ });
        // contentContainer.appendChild(actionsContainer); // Seharusnya di luar .ai-message-content, tapi di dalam .ai-message
        if (aiMessageElement.classList.contains('ai-message') && !aiMessageElement.querySelector('.code-block')) { // Hanya tambah jika bukan code block murni
             aiMessageElement.appendChild(actionsContainer);
        } else if (aiMessageElement.classList.contains('ai-message') && aiMessageElement.querySelector('.code-block')) {
            // Untuk code block, tombol copy sudah ada di headernya. Mungkin tambahkan aksi lain di sini jika perlu.
        }
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
    }


    async function generateRealAIResponse(userMessage, files = []) {
        if (thinkingIndicator) {
            thinkingIndicator.classList.remove('hidden');
            thinkingIndicator.style.opacity = '1';
        }
        if(chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll saat thinking muncul

        try {
            const payload = { userMessage: userMessage };
            if (files && files.length > 0) {
                payload.fileDetails = files.map(f => ({ name: f.name, type: f.type, size: f.size }));
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = data.message || `Server error (${response.status})`;
                if (data && data.errorType === 'model_loading') {
                    const estimatedTime = data.estimated_time ? ` Perkiraan waktu: ${data.estimated_time} detik.` : '';
                    errorMessage = `Maaf, model AI sedang disiapkan.${estimatedTime} Silakan coba beberapa saat lagi.`;
                }
                addChatMessage(errorMessage, 'ai'); // Menampilkan pesan error dari backend
                throw new Error(errorMessage); // Dilempar agar catch di bawah menangani UI thinking indicator
            }

            const rawAiResponseText = data.text;
            const aiMessageElement = addChatMessage(rawAiResponseText, 'ai');
            // addAiMessageActions(aiMessageElement); // Panggil jika struktur HTML-nya mendukung

        } catch (error) {
            console.error('SCRIPT.JS: Error fetching from /api/generate:', error);
            // Pesan error sudah ditangani di atas jika !response.ok
            // Ini lebih untuk error jaringan atau parsing JSON yang gagal sebelum !response.ok
            if (!response || response.ok) { // Hanya tampilkan jika belum ada pesan error dari blok !response.ok
                 addChatMessage(`<span>Maaf, terjadi masalah koneksi: ${error.message}. Silakan coba lagi.</span>`, 'ai');
            }
        } finally {
            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => { if (thinkingIndicator) thinkingIndicator.classList.add('hidden'); }, 300);
            clearAttachedFiles();
            checkScrollable();
        }
    }


    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message !== '' || attachedFiles.length > 0) {
                let finalPrompt = message;
                if (attachedFiles.length > 0 && message === '') {
                    finalPrompt = `Harap menganalisis file terlampir.`; // Prompt default jika hanya file
                } else if (attachedFiles.length > 0) {
                    // Tidak perlu menambahkan nama file ke prompt jika backend tidak menggunakannya secara eksplisit
                }

                if (currentActivePage === 'welcome') {
                    showPage('chat', finalPrompt);
                } else {
                    addChatMessage(finalPrompt, 'user');
                    generateRealAIResponse(finalPrompt, attachedFiles);
                }
                messageInput.value = '';
                autoResizeTextarea();
            }
        });
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendButton.click();
            }
        });
    }


    if (menuIcon && sidebar && sidebarOverlay) {
        menuIcon.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (backIcon) {
      backIcon.addEventListener('click', () => {
          showPage('welcome');
          if (chatHistory) { // Kosongkan riwayat chat saat kembali ke welcome
               const ti = chatHistory.querySelector('#thinkingIndicator');
               chatHistory.innerHTML = '';
               if (ti) chatHistory.appendChild(ti); // Tambahkan lagi thinking indicator yang kosong
          }
          if(messageInput) messageInput.value = '';
          autoResizeTextarea();
          clearAttachedFiles();
      });
    }

    // Tema
    const savedTheme = localStorage.getItem('novaria_theme') || localStorage.getItem('novaai_theme'); // Cek kedua key
    function applyTheme(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('novaria_theme', isLightMode ? 'light' : 'dark'); // Standarisasi ke 'novaria_theme'
        if(themeToggleLanding) themeToggleLanding.checked = isLightMode;
        // Jika ada theme toggle di sidebar, sinkronkan juga
        const themeToggleSidebar = document.getElementById('themeToggleSidebar');
        if(themeToggleSidebar) themeToggleSidebar.checked = isLightMode;
    }
    if (savedTheme === 'light' || savedTheme === 'light-mode') {
        applyTheme(true);
    } else {
        applyTheme(false);
    }
    if (themeToggleLanding) {
        themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));
    }
    // Jika Anda menambahkan kembali toggle tema di sidebar:
    // const themeToggleSidebar = document.getElementById('themeToggleSidebar');
    // if (themeToggleSidebar) {
    //     themeToggleSidebar.addEventListener('change', () => applyTheme(themeToggleSidebar.checked));
    // }


    // --- FITUR UPLOAD FILE (JIKA MASIH DIGUNAKAN) ---
    if(plusButton && fileInput && fileChipContainer) {
        plusButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            const filesToProcess = Array.from(event.target.files);
            if (filesToProcess.length === 0) return;
            let canAddCount = MAX_FILES_ALLOWED - attachedFiles.length;
            const newValidFiles = [];
            for (const file of filesToProcess) {
                if (newValidFiles.length >= canAddCount) { alert(`Hanya bisa menambah ${canAddCount} file lagi.`); break; }
                if (file.size > MAX_FILE_SIZE_BYTES_NEW) { alert(`File "${file.name}" melebihi ${MAX_FILE_SIZE_KB_NEW}KB.`); continue; }
                if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) { alert(`File "${file.name}" sudah ada.`); continue; }
                newValidFiles.push(file);
            }
            newValidFiles.forEach(file => { attachedFiles.push(file); displayFileChipItem(file); });
            fileInput.value = ''; // Reset input file
        });
    }
    function displayFileChipItem(file) { /* ... (definisi fungsi dari script.js Anda sebelumnya) ... */ }
    function removeAttachedFile(fileName, fileSize) { /* ... (definisi fungsi dari script.js Anda sebelumnya) ... */ }
    function clearAttachedFiles() { /* ... (definisi fungsi dari script.js Anda sebelumnya) ... */ }
    function updateInputAreaAppearance() { /* ... (definisi fungsi dari script.js Anda sebelumnya) ... */ }


    // --- FITUR VOICE INPUT (JIKA MASIH DIGUNAKAN) ---
    if (voiceInputButton && messageInput && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'id-ID'; // Default ke Indonesia, bisa disesuaikan
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';

        recognition.onstart = () => { voiceInputButton.style.backgroundColor = 'red'; if(messageInput) messageInput.placeholder = 'Mendengarkan...'; };
        recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } if(messageInput) messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); };
        recognition.onend = () => { voiceInputButton.style.backgroundColor = ''; if(messageInput) { if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); } if (messageInput.value.trim() === '') { messageInput.placeholder = placeholders_en[currentPlaceholderIndex]; /* Ganti jika ada terjemahan placeholder */ } } finalTranscript = ''; };
        recognition.onerror = (event) => { voiceInputButton.style.backgroundColor = ''; if(messageInput) messageInput.placeholder = placeholders_en[currentPlaceholderIndex]; finalTranscript = ''; console.error('Speech recognition error:', event.error); alert('Speech recognition error: ' + event.error); };
        voiceInputButton.addEventListener('click', () => { try { if (recognition && recognition.recording) { recognition.stop(); } else if (recognition) { recognition.start(); } } catch (e) { if (recognition) recognition.stop(); console.error("Error starting/stopping recognition", e); } });
    } else if (voiceInputButton) {
        voiceInputButton.style.display = 'none';
    }


    // --- INISIALISASI HALAMAN AWAL ---
    // Pengecekan login sudah dilakukan di paling atas.
    // Jika lolos, currentUser sudah terisi.
    if (isLoggedIn === 'true') {
        showPage('welcome'); // Tampilkan welcome page jika sudah login
    }
    // Tidak perlu lagi initialChatMessageFromStorage jika quick complete dan terjemahan dihapus

    // Setup ripple effects (jika masih digunakan)
    // setupRippleEffects();
    // const observer = new MutationObserver(...)
    // observer.observe(...)
});

// Fungsi global yang mungkin dipanggil dari HTML (seperti copyCode)
function copyCode(buttonElement) {
    const pre = buttonElement.closest('.code-block').querySelector('pre');
    if (pre && pre.textContent) {
        navigator.clipboard.writeText(pre.textContent).then(() => {
            const span = buttonElement.querySelector('span');
            const originalText = span ? span.textContent : buttonElement.textContent;
            if(span) span.textContent = 'Copied!'; else buttonElement.textContent = 'Copied!';
            // Ganti ikon jika mau
            setTimeout(() => { if(span) span.textContent = originalText; else buttonElement.textContent = originalText; }, 2000);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
            // Handle error copy
        });
    }
}
function formatFileSize(bytes, decimals = 2) { if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; }
