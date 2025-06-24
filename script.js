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
    const homeIcon = document.getElementById('homeIcon'); // Ikon Home baru
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const themeToggleLanding = document.getElementById('themeToggleLanding');
    const quickCompleteContainer = document.getElementById('quickCompleteContainer');
    const chatHistoryElement = document.getElementById('chatHistory'); // Ganti nama variabel agar tidak bentrok dengan histori data
    const thinkingIndicator = document.getElementById('thinkingIndicator');

    const welcomeSection = document.getElementById('welcomeSection');
    const chatSection = document.getElementById('chatSection');
    const landingThemeToggleContainer = document.getElementById('landingThemeToggleContainer');
    const mainContent = document.querySelector('main');

    let currentActivePage = 'welcome';

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

    // === AWAL: LOGIKA HISTORI CHAT ===
    const sidebarChatHistoryElement = document.getElementById('sidebarChatHistory'); // Kontainer histori di sidebar
    const newChatButton = document.getElementById('newChatButton'); // Tombol New Chat
    const deleteHistoryIcon = document.getElementById('deleteHistoryIcon'); // Ikon hapus histori (total)

    let chatHistories = loadChatHistories(); // Memuat histori saat script dimulai
    let currentChatId = null; // ID chat yang sedang aktif

    function loadChatHistories() {
        const storedHistories = localStorage.getItem('novaai_chat_histories');
        try {
            return storedHistories ? JSON.parse(storedHistories) : [];
        } catch (e) {
            console.error("Error parsing chat histories from localStorage:", e);
            return []; // Kembali ke array kosong jika terjadi error parsing
        }
    }

    function saveChatHistories() {
        localStorage.setItem('novaai_chat_histories', JSON.stringify(chatHistories));
    }

    function renderChatHistoryList() {
        if (!sidebarChatHistoryElement) return;

        sidebarChatHistoryElement.innerHTML = ''; // Bersihkan daftar histori

        if (chatHistories.length === 0) {
            sidebarChatHistoryElement.innerHTML = '<div style="text-align: center; opacity: 0.7; margin-top: 20px;">No chat history yet.</div>';
            deleteHistoryIcon.classList.add('hidden'); // Sembunyikan ikon hapus jika kosong
            return;
        } else {
             deleteHistoryIcon.classList.remove('hidden'); // Tampilkan ikon hapus jika ada histori
        }


        chatHistories.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            if (history.id === currentChatId) {
                historyItem.classList.add('active');
            }
            historyItem.dataset.chatId = history.id;

            const titleSpan = document.createElement('span');
            titleSpan.classList.add('history-item-title');
            // Gunakan judul atau pesan pertama jika judul kosong
            titleSpan.textContent = history.title || (history.messages.length > 0 ? history.messages[0].content.substring(0, 30) + '...' : 'New Chat');
            historyItem.appendChild(titleSpan);

            // Ikon 3 titik (opsional, bisa ditambahkan fungsi dropdown nanti)
            const optionsSpan = document.createElement('span');
            optionsSpan.classList.add('history-item-options');
            // const optionsIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="options-icon"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
            // optionsSpan.innerHTML = optionsIconSvg;
            // historyItem.appendChild(optionsSpan);

            historyItem.addEventListener('click', () => {
                loadChatHistory(history.id);
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });

            sidebarChatHistoryElement.appendChild(historyItem);
        });
    }

    function startNewChat() {
        // Opsional: Simpan chat saat ini sebelum memulai yang baru
        // saveCurrentChat(); // Implementasikan ini jika Anda ingin menyimpan chat yang belum diberi judul saat membuat yang baru

        currentChatId = null; // Set ID chat saat ini menjadi null
        clearChatDisplay(); // Bersihkan tampilan chat

        // Jika page saat ini adalah welcome, tetap di welcome
        // Jika page saat ini adalah chat, tampilkan halaman chat kosong
        if (currentActivePage !== 'welcome') {
             showPage('welcome'); // Kembali ke halaman sambutan
        }

        clearAttachedFiles();
        updateInputAreaAppearance();

        // Tampilkan quick suggestions jika di welcome dan input kosong
         if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
             quickCompleteContainer.classList.add('active');
         } else {
             quickCompleteContainer.classList.remove('active');
         }


        renderChatHistoryList(); // Perbarui daftar histori di sidebar
    }

    function loadChatHistory(chatId) {
        const historyToLoad = chatHistories.find(history => history.id === chatId);
        if (historyToLoad) {
            // saveCurrentChat(); // Simpan chat yang sedang aktif sebelum memuat yang baru (opsional)
            currentChatId = chatId;
            clearChatDisplay(); // Bersihkan tampilan chat
            historyToLoad.messages.forEach(msg => {
                 // Perlu sanitasi HTML jika content berisi markdown yang sudah di-render
                 // Sederhananya, kita asumsikan content sudah siap render HTML
                addChatMessage(msg.content, msg.sender);
            });
             showPage('chat'); // Pindah ke halaman chat
             clearAttachedFiles(); // Kosongkan file saat memuat histori
             updateInputAreaAppearance();
             quickCompleteContainer.classList.remove('active'); // Sembunyikan quick suggestions di mode chat
             renderChatHistoryList(); // Perbarui tampilan item aktif di sidebar
        } else {
            console.warn("Chat history not found with ID:", chatId);
        }
    }

     function saveCurrentChat(userMessageContent, aiResponseHtml) {
         // Dapatkan semua pesan dari DOM, atau simpan dari array jika Anda menyimpan semua pesan di JS
         // Untuk kesederhanaan, kita akan membuat objek histori baru atau memperbarui yang sudah ada.

         // Jika belum ada chat ID (chat baru) atau chat ID saat ini tidak ditemukan di histori
         if (currentChatId === null || !chatHistories.find(h => h.id === currentChatId)) {
             currentChatId = Date.now(); // Buat ID baru berbasis timestamp
             const newHistory = {
                 id: currentChatId,
                 title: userMessageContent.substring(0, 50) + (userMessageContent.length > 50 ? '...' : ''), // Judul dari pesan pertama
                 messages: [
                     { sender: 'user', content: userMessageContent },
                     { sender: 'ai', content: aiResponseHtml } // Simpan AI response dalam format HTML
                 ],
                 timestamp: Date.now()
             };
             chatHistories.unshift(newHistory); // Tambahkan di awal daftar
         } else {
             // Jika chat ID sudah ada, tambahkan pesan baru ke histori yang sudah ada
             const existingHistory = chatHistories.find(h => h.id === currentChatId);
             if (existingHistory) {
                 existingHistory.messages.push({ sender: 'user', content: userMessageContent });
                 existingHistory.messages.push({ sender: 'ai', content: aiResponseHtml });
                 existingHistory.timestamp = Date.now(); // Update timestamp
                 // Opsional: Perbarui judul jika pesan pertama berubah atau setelah beberapa pesan
                 if (!existingHistory.title || existingHistory.title.endsWith('...')) {
                     existingHistory.title = existingHistory.messages[0].content.substring(0, 50) + (existingHistory.messages[0].content.length > 50 ? '...' : '');
                 }
             }
         }
         saveChatHistories(); // Simpan ke localStorage
         renderChatHistoryList(); // Render ulang daftar histori
     }


    function clearChatDisplay() {
        if (chatHistoryElement) {
             // Kosongkan hanya pesan, pertahankan thinking indicator
             const messages = chatHistoryElement.querySelectorAll('.chat-message');
             messages.forEach(msg => msg.remove());
        }
        // Reset thinking indicator state
        if (thinkingIndicator) {
            thinkingIndicator.classList.add('hidden');
            thinkingIndicator.style.opacity = '0';
        }
         // Bersihkan file yang dilampirkan di UI
         clearAttachedFiles();
         // Reset input text
         messageInput.value = '';
         autoResizeTextarea();
         // Reset placeholder animation
         startPlaceholderAnimation();

    }

    function deleteAllHistories() {
        if (confirm("Are you sure you want to delete all chat histories? This cannot be undone.")) {
            chatHistories = [];
            saveChatHistories();
            clearChatDisplay(); // Bersihkan tampilan chat saat ini juga
             currentChatId = null; // Reset current chat ID
            renderChatHistoryList();
            showPage('welcome'); // Kembali ke halaman sambutan

        }
    }

    // Event listeners untuk fitur histori chat
     if (newChatButton) {
         newChatButton.addEventListener('click', startNewChat);
     }
     if (deleteHistoryIcon) {
         deleteHistoryIcon.addEventListener('click', deleteAllHistories);
     }
     // Event listener untuk ikon Home (mengarah ke login.html)
     if(homeIcon) {
         homeIcon.addEventListener('click', () => {
             // Opsional: Simpan chat saat ini sebelum pindah halaman
             // saveCurrentChat();
             window.location.href = 'login.html';
         });
     }


    // Render histori chat saat DOM fully loaded
     renderChatHistoryList();

    // === AKHIR: LOGIKA HISTORI CHAT ===


    function checkScrollable() {
        setTimeout(() => {
            if (!chatHistoryElement) return;
            const isScrollable = chatHistoryElement.scrollHeight > chatHistoryElement.clientHeight;
            const isAtBottom = chatHistoryElement.scrollHeight - chatHistoryElement.scrollTop <= chatHistoryElement.clientHeight + 5;
            if (isScrollable && !isAtBottom) {
                chatHistoryElement.classList.add('has-scroll-fade');
            } else {
                chatHistoryElement.classList.remove('has-scroll-fade');
            }
        }, 100);
    }
    if (chatHistoryElement) {
      chatHistoryElement.addEventListener('scroll', checkScrollable);
    }

    function showPage(pageName, initialMessage = null) {
        // Jika sudah di halaman yang diminta dan tidak ada pesan awal, keluar
        if (currentActivePage === pageName && !initialMessage && chatHistoryElement.children.length > (thinkingIndicator ? 1 : 0)) {
             // Tambahan: Jika di chat page dan sudah ada pesan, jangan alihkan ke welcome
             if (pageName === 'welcome' && chatHistoryElement.children.length > (thinkingIndicator ? 1 : 0)) {
                 return; // Jangan kembali ke welcome jika chat tidak kosong
             }
             if (pageName === 'chat' && chatHistoryElement.children.length <= (thinkingIndicator ? 1 : 0)) {
                  // Jika di chat page tapi kosong, biarkan proses lanjut untuk menampilkan pesan awal
             } else if (currentActivePage === pageName && !initialMessage) {
                 return; // Jika halaman sama dan tidak ada pesan awal
             }
        }

        const currentPageElement = document.getElementById(currentActivePage + 'Section');
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
            // Tambahkan delay untuk memastikan animasi selesai sebelum display: none
            setTimeout(() => { currentPageElement.classList.add('hidden'); }, 500);
        }

        const nextPageElement = document.getElementById(pageName + 'Section');
        if (nextPageElement) {
            nextPageElement.classList.remove('hidden');
            // Kecilkan delay sebelum menambah active class
            setTimeout(() => { nextPageElement.classList.add('active'); }, 10);
        }
        currentActivePage = pageName;

        if (pageName === 'chat') {
            // landingThemeToggleContainer.classList.add('hidden'); // Sembunyikan toggle tema di header
            menuIcon.classList.add('hidden'); // Sembunyikan ikon menu
            backIcon.classList.remove('hidden'); // Tampilkan ikon back
             homeIcon.classList.add('hidden'); // Sembunyikan ikon home di mode chat (jika ada di header)

            // Pastikan chat history scroll ke bawah setelah transisi
            setTimeout(() => {
                if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
                checkScrollable();
            }, 50); // Sesuaikan delay jika perlu

            quickCompleteContainer.classList.remove('active'); // Quick suggestions dinonaktifkan di chat page

        } else { // pageName === 'welcome'
            // landingThemeToggleContainer.classList.remove('hidden'); // Tampilkan toggle tema di header
            menuIcon.classList.remove('hidden'); // Tampilkan ikon menu
            backIcon.classList.add('hidden'); // Sembunyikan ikon back
             homeIcon.classList.remove('hidden'); // Tampilkan ikon home di welcome (jika ada di header)

             // Tampilkan quick suggestions jika di welcome page dan input kosong
             if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                 quickCompleteContainer.classList.add('active');
             }
        }
         // Update padding-bottom main content
         updateInputAreaAppearance();


        if (pageName === 'chat' && initialMessage) {
            // Jika ini pesan awal untuk chat baru, jangan buat histori langsung di sini
            // Histori akan dibuat/diperbarui setelah AI merespons di generateRealAIResponse
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, attachedFiles);
        }

    }

    // Placeholder disederhanakan, tidak lagi multilingual
    const placeholders_en = ["Ask me anything...","What's on your mind?","Tell me a story...","How can I help you today?","Start a conversation...","I'm ready to chat!","Let's explore together...","What do you want to learn?"];
    let currentPlaceholderIndex = 0;
    let placeholderInterval; // Variabel untuk menyimpan ID interval

     function updatePlaceholder() {
         if (messageInput.value.trim() !== '') return; // Jangan ubah placeholder jika ada teks

         messageInput.style.opacity = '0';
         messageInput.style.transform = 'translateY(-10px)';

         setTimeout(() => {
             currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders_en.length;
             messageInput.placeholder = placeholders_en[currentPlaceholderIndex];
             messageInput.style.opacity = '1';
             messageInput.style.transform = 'translateY(0)';
         }, 500); // Durasi sama dengan CSS transition
     }

    function startPlaceholderAnimation() {
        // Hentikan interval lama jika ada
        if (placeholderInterval) {
            clearInterval(placeholderInterval);
        }
         // Mulai animasi placeholder hanya jika input kosong dan tidak ada file dan di halaman welcome
         if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
            updatePlaceholder(); // Panggil sekali di awal untuk set placeholder
            placeholderInterval = setInterval(updatePlaceholder, 3000);
         }
    }

    function stopPlaceholderAnimation() {
        if (placeholderInterval) {
            clearInterval(placeholderInterval);
        }
    }


    messageInput.addEventListener('focus', () => {
        stopPlaceholderAnimation(); // Hentikan animasi saat fokus
        quickCompleteContainer.classList.remove('active'); // Sembunyikan quick suggestions saat input fokus
    });

    messageInput.addEventListener('blur', () => {
         // Mulai kembali animasi jika input kosong dan tidak ada file setelah blur
         startPlaceholderAnimation();

         // Tampilkan quick suggestions jika input kosong, tidak ada file, dan di welcome page setelah blur
         if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
             quickCompleteContainer.classList.add('active');
         }
    });

    messageInput.addEventListener('input', () => {
        // Sembunyikan quick suggestions saat ada input teks atau file dilampirkan
        if (messageInput.value.trim() !== '' || attachedFiles.length > 0) {
            quickCompleteContainer.classList.remove('active');
            stopPlaceholderAnimation(); // Hentikan animasi placeholder jika ada input
             messageInput.placeholder = "Ask me anything..."; // Reset placeholder ke default
        } else {
            // Jika input kosong dan tidak ada file, dan di welcome page, tampilkan quick suggestions
             if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
                startPlaceholderAnimation(); // Mulai animasi placeholder jika input kosong
             }
        }
        autoResizeTextarea();
    });

    // Mulai animasi placeholder saat pertama kali dimuat jika di welcome page
    if (currentActivePage === 'welcome') {
        startPlaceholderAnimation();
         // Tampilkan quick suggestions di awal jika input kosong dan di welcome page
         if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
             quickCompleteContainer.classList.add('active');
         }
    }


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

        if (chatHistoryElement && thinkingIndicator) {
            chatHistoryElement.insertBefore(messageElement, thinkingIndicator);
        } else if (chatHistoryElement) {
            chatHistoryElement.appendChild(messageElement);
        }

        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);

        setTimeout(() => {
            if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
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
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const lastUserMessage = Array.from(chatHistoryElement.querySelectorAll('.user-message')).pop(); if (lastUserMessage) { msgEl.remove(); generateRealAIResponse(lastUserMessage.textContent, attachedFiles); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        contentContainer.appendChild(actionsContainer);
        setTimeout(() => { if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight; }, 0);
    }


    async function generateRealAIResponse(userMessage, files = []) {
        if (thinkingIndicator) {
            thinkingIndicator.classList.remove('hidden');
            thinkingIndicator.style.opacity = '1';
        }
        setTimeout(() => {
            if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
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

                // Simpan chat ke histori setelah mendapatkan respons AI
                 saveCurrentChat(userMessage, finalHtmlContent); // Simpan pesan user asli dan respons AI dalam HTML


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

                 // Jika terjadi error, simpan pesan user tapi tidak simpan pesan error dari AI (opsional)
                 // Atau simpan error message jika Anda ingin merekam error dalam histori
                // saveCurrentChat(userMessage, errorMessage);

            }, 300);
        }
    }


    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        // Hanya kirim jika ada pesan teks atau file dilampirkan
        if (message !== '' || attachedFiles.length > 0) {
            let finalPrompt = message;
             // Jika hanya ada file, buat prompt default
             if (attachedFiles.length > 0 && message === '') {
                 const fileNames = attachedFiles.map(f => f.name).join(', ');
                 finalPrompt = `Harap menganalisis file-file ini: ${fileNames}`;
             } else if (attachedFiles.length > 0) {
                 // Jika ada teks dan file, tambahkan catatan tentang file ke prompt
                 const fileNames = attachedFiles.map(f => f.name).join(', ');
                 finalPrompt = `${message} (Dilampirkan: ${fileNames})`;
             }


            // Jika di halaman welcome, pindah ke chat dan mulai chat baru
            if (currentActivePage === 'welcome') {
                showPage('chat', finalPrompt); // Panggil showPage dengan pesan awal
            } else {
                // Jika sudah di halaman chat, tambahkan pesan dan panggil generate response
                addChatMessage(finalPrompt, 'user');
                generateRealAIResponse(finalPrompt, attachedFiles);
            }

            // Bersihkan input setelah dikirim
            messageInput.value = '';
            autoResizeTextarea();
            clearAttachedFiles(); // Bersihkan file setelah dikirim

            // Sembunyikan quick suggestions setelah mengirim pesan
            quickCompleteContainer.classList.remove('active');
            stopPlaceholderAnimation(); // Hentikan animasi placeholder

        }
    });
    // Kirim pesan saat Enter (tanpa Shift+Enter)
    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

    // Hapus initialChatMessageFromStorage karena terjemahan dan quick suggestions dihapus
    // const initialChatMessageFromStorage = localStorage.getItem('initialChatMessage');
    // Panggil showPage setelah semua setup, memastikan halaman yang benar ditampilkan
    // Tentukan halaman awal: jika ada histori atau pesan di local storage, tampilkan chat, jika tidak, welcome
    if (isLoggedIn === 'true') {
        // Cek apakah ada histori chat yang bisa dimuat sebagai chat saat ini (opsional)
        // Misalnya, selalu muat chat terakhir yang diakses jika ada
        // Untuk kesederhanaan, kita akan mulai dari welcome kecuali ada chat ID yang tersimpan sebagai 'lastActiveChatId'
        const lastActiveChatId = localStorage.getItem('novaai_last_active_chat_id');
        if (lastActiveChatId) {
             loadChatHistory(parseInt(lastActiveChatId, 10)); // Muat chat terakhir jika ada
        } else {
             showPage('welcome'); // Jika tidak ada, tampilkan welcome
        }
    }


    // Event listener untuk sidebar
    menuIcon.addEventListener('click', () => {
         sidebar.classList.add('active');
         sidebarOverlay.classList.add('active');
         renderChatHistoryList(); // Render ulang histori saat sidebar dibuka
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
    // Event listener untuk ikon Back (kembali ke welcome, clear chat)
    backIcon.addEventListener('click', () => {
        // Opsional: Simpan chat saat ini sebelum kembali ke welcome
        // saveCurrentChat();

        startNewChat(); // Gunakan fungsi startNewChat untuk membersihkan dan kembali ke welcome
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

    themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));

    // Hapus semua fungsi modal
    // function openModal(titleKey, contentKey) { ... }
    // function closeModal() { ... }
    // modalCloseBtn.addEventListener('click', closeModal);
    // infoModalOverlay.addEventListener('click', ...);
    // document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(...);

    function setupRippleEffects() {
        const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .remove-chip-btn, .new-chat-button'); // Tambahkan .new-chat-button
        clickableElements.forEach(element => {
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }
            const newHandler = function (e) {
                // Jangan picu ripple jika klik ikon hapus di sidebar histori
                 if (e.target.closest('.delete-history-icon')) {
                     return;
                 }

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
    const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { let needsRippleSetup = false; mutation.addedNodes.forEach(node => { if (node.nodeType === 1) { if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn') || node.matches('.remove-chip-btn') || node.matches('.history-item') || node.matches('.new-chat-button'))) { needsRippleSetup = true; } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn') || node.querySelector('.remove-chip-btn') || node.querySelector('.history-item') || node.querySelector('.new-chat-button'))) { needsRippleSetup = true; } } }); if (needsRippleSetup) { setupRippleEffects(); } } }); });
    if (chatHistoryElement) observer.observe(chatHistoryElement, { childList: true, subtree: true });
    // quickCompleteContainer tidak lagi di-observe karena tidak diisi dinamis
    // if (quickCompleteContainer) observer.observe(quickCompleteContainer, { childList: true, subtree: true });
    if (fileChipContainer) observer.observe(fileChipContainer, { childList: true, subtree: true });
     // Observe sidebarChatHistoryElement untuk item histori baru
     if (sidebarChatHistoryElement) observer.observe(sidebarChatHistoryElement, { childList: true, subtree: true });


    function updateInputAreaAppearance() {
        const inputWrapperHeight = inputWrapper.offsetHeight;
        const totalBottomSpace = inputWrapperHeight + 15; // 15px bottom margin

        // Sesuaikan padding-bottom main content agar input area tidak menutupi chat history
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; // Tambahkan sedikit ruang extra

        // Sesuaikan tinggi chatHistoryElement agar scrollbar berfungsi dengan baik
        if (chatHistoryElement) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const mainPaddingTop = parseInt(window.getComputedStyle(mainContent).paddingTop, 10);
             const mainPaddingBottom = parseInt(window.getComputedStyle(mainContent).paddingBottom, 10);
            chatHistoryElement.style.height = `calc(100% - ${headerHeight}px - ${inputWrapperHeight}px - ${15 + 20}px)`; // Hitung tinggi yang tersedia
             // Alternatif: atur flex-grow untuk chatHistoryElement dalam chatSection (jika chatSection display flex)
             // chatHistoryElement.style.flexGrow = 1;
             // chatHistoryElement.style.height = 'auto'; // Biarkan flexbox menentukan tinggi
        }

        // Scroll to bottom setelah update tata letak
        setTimeout(() => {
            if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
            checkScrollable();
        }, 50); // Small delay to allow layout to update
    }
     // Panggil updateInputAreaAppearance saat window resize juga
     window.addEventListener('resize', updateInputAreaAppearance);
     // Panggil setelah DOM loaded
     updateInputAreaAppearance();


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

                // Tampilkan quick suggestions jika tidak ada file dan tidak ada teks setelah menghapus file
                 if (attachedFiles.length === 0 && messageInput.value.trim() === '' && currentActivePage === 'welcome') {
                     quickCompleteContainer.classList.add('active');
                     startPlaceholderAnimation(); // Mulai animasi placeholder
                 }

            }, 300);
        }
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        fileChipContainer.innerHTML = '';
        fileChipContainer.style.display = 'none';
        autoResizeTextarea();
        updateInputAreaAppearance();
        // Tampilkan quick suggestions jika tidak ada file dan tidak ada teks setelah membersihkan file
         if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
             quickCompleteContainer.classList.add('active');
             startPlaceholderAnimation(); // Mulai animasi placeholder
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
            displayFileChipItem(file);
        });

        fileInput.value = '';
        // Sembunyikan quick suggestions saat ada file baru ditambahkan
         if (attachedFiles.length > 0 || messageInput.value.trim() !== '') {
             quickCompleteContainer.classList.remove('active');
             stopPlaceholderAnimation(); // Hentikan animasi placeholder
             messageInput.placeholder = "Ask me anything..."; // Reset placeholder ke default
         }
    });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Bahasa diset default karena fitur bahasa dihapus
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';
        recognition.onstart = () => { voiceInputButton.style.backgroundColor = 'red'; messageInput.placeholder = 'Listening...'; stopPlaceholderAnimation(); quickCompleteContainer.classList.remove('active'); }; // Hentikan animasi placeholder dan sembunyikan quick suggestions
        recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); };
        recognition.onend = () => { voiceInputButton.style.backgroundColor = ''; if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); } if (messageInput.value.trim() === '') { startPlaceholderAnimation(); quickCompleteContainer.classList.add('active'); } else { messageInput.placeholder = "Ask me anything..."; } finalTranscript = ''; }; // Mulai animasi placeholder dan tampilkan quick suggestions jika input kosong setelah selesai
        recognition.onerror = (event) => { voiceInputButton.style.backgroundColor = ''; if (messageInput.value.trim() === '') { startPlaceholderAnimation(); quickCompleteContainer.classList.add('active'); } else { messageInput.placeholder = "Ask me anything..."; } finalTranscript = ''; alert('Speech recognition error: ' + event.error); }; // Mulai animasi placeholder dan tampilkan quick suggestions jika input kosong setelah error
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