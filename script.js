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

            // === AWAL: DISPLAY PROFIL PENGGUNA DI SIDEBAR ===
            const profilePicture = document.getElementById('profilePicture');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const sidebarUserProfile = document.getElementById('sidebarUserProfile');
            const sidebarLoginSignup = document.getElementById('sidebarLoginSignup');

            if (currentUser) {
                if (profilePicture) profilePicture.src = currentUser.picture || 'placeholder-user.png';
                if (profileName) profileName.textContent = currentUser.name || 'User';
                if (profileEmail) profileEmail.textContent = currentUser.email || 'user@example.com';
                if (sidebarUserProfile) sidebarUserProfile.style.display = 'flex';
                if (sidebarLoginSignup) sidebarLoginSignup.style.display = 'none'; // Sembunyikan Login/Signup jika sudah login
            } else {
                if (sidebarUserProfile) sidebarUserProfile.style.display = 'none';
                if (sidebarLoginSignup) sidebarLoginSignup.style.display = 'flex';
            }
            // === AKHIR: DISPLAY PROFIL PENGGUNA DI SIDEBAR ===

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

    // Updated Element IDs
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButtonBottom'); // Updated ID
    const menuIcon = document.getElementById('menuIcon');
    const backIcon = document.getElementById('backIcon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const themeToggleLanding = document.getElementById('themeToggleLanding');
    const quickCompleteContainer = document.getElementById('quickCompleteContainer');
    const chatHistory = document.getElementById('chatHistory');
    const thinkingIndicator = document.getElementById('thinkingIndicator');

    const welcomeSection = document.getElementById('welcomeSection');
    const chatSection = document.getElementById('chatSection');
    const landingThemeToggleContainer = document.getElementById('landingThemeToggleContainer'); // This remains for global theme toggle
    const mainContent = document.querySelector('main');

    let currentActivePage = 'welcome';

    const plusButton = document.getElementById('plusButtonTop'); // Updated ID
    const fileInput = document.getElementById('fileInput'); // ID remains the same, but HTML moved
    const bottomChatArea = document.getElementById('bottomChatArea'); // Wrapper for whole bottom section
    const newInputWrapperContainer = document.querySelector('.new-input-wrapper-container'); // The main new input container

    const MAX_FILE_SIZE_KB_NEW = 450;
    const MAX_FILE_SIZE_BYTES_NEW = MAX_FILE_SIZE_KB_NEW * 1024;
    const MAX_FILES_ALLOWED = 5;
    const fileChipContainer = document.getElementById('fileChipContainer');
    const fileChipsArea = document.getElementById('fileChipsArea'); // Area pembungkus chips
    let attachedFiles = []; // Ini akan menyimpan objek File asli

    // === AWAL: IMPLEMENTASI DAYA INGAT (CONVERSATION HISTORY) ===
    let conversationHistory = []; // Array untuk menyimpan riwayat pesan
    const MAX_HISTORY_LENGTH = 10; // Batasi jumlah pasangan pesan (User+AI) yang disimpan
    // =========================================================

    // === AWAL: CUSTOM SELEKTOR MODEL AI (MODAL) & NEW FAST/SMART TOGGLE ===
    const customModelSelectorTrigger = document.getElementById('customModelSelectorTrigger');
    const selectedModelName = document.getElementById('selectedModelName');
    const modelSelectModal = document.getElementById('modelSelectModal');
    const modelOptionsContainer = document.getElementById('modelOptions');
    const closeModelModalButton = document.getElementById('closeModelModal');

    // New Fast/Smart Toggle elements
    const fastButton = document.getElementById('fastButton');
    const smartButton = document.getElementById('smartButton');

    // Define available models with appropriate labels
    // Aligned for Fast/Smart: 1.5 Flash for Fast, 1.5 Pro for Smart
    const availableModels = [
        { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash', type: 'fast' },
        { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', type: 'smart' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', type: 'other' } // Example of another model
    ];

    let currentSelectedModelValue = '';

    // Function to set the selected model and update UI
    function setSelectedModel(modelValue, updateFastSmartToggle = true) {
        currentSelectedModelValue = modelValue;
        localStorage.setItem('selectedAiModel', currentSelectedModelValue);
        const selectedModel = availableModels.find(m => m.value === currentSelectedModelValue);
        if (selectedModel) {
            selectedModelName.textContent = selectedModel.label;
            if (updateFastSmartToggle) {
                // Update Fast/Smart toggle state
                fastButton.classList.remove('active');
                smartButton.classList.remove('active');
                if (selectedModel.type === 'fast') {
                    fastButton.classList.add('active');
                } else if (selectedModel.type === 'smart') {
                    smartButton.classList.add('active');
                }
            }
        } else {
            // Fallback if model not found (e.g., from old storage)
            selectedModelName.textContent = 'Unknown Model';
            fastButton.classList.remove('active');
            smartButton.classList.remove('active');
        }
    }

    // Fungsi untuk menampilkan modal pemilihan model
    function openModelSelectModal() {
        modelSelectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        populateModelOptions();
    }

    // Fungsi untuk menyembunyikan modal pemilihan model
    function closeModelSelectModal() {
        modelSelectModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Fungsi untuk mengisi opsi model ke dalam modal
    function populateModelOptions() {
        modelOptionsContainer.innerHTML = ''; // Bersihkan opsi sebelumnya
        availableModels.forEach(model => {
            const optionItem = document.createElement('div');
            optionItem.classList.add('model-option-item');
            optionItem.dataset.modelValue = model.value;
            optionItem.innerHTML = `
                <span>${model.label}</span>
                <svg class="checkmark" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;

            if (model.value === currentSelectedModelValue) {
                optionItem.classList.add('selected');
            }

            optionItem.addEventListener('click', () => {
                setSelectedModel(model.value, true); // Update toggle based on selection
                setTimeout(closeModelSelectModal, 200);
            });
            modelOptionsContainer.appendChild(optionItem);
        });
    }

    // Set default model on DOMContentLoaded
    const savedModelValue = localStorage.getItem('selectedAiModel');
    const defaultModel = availableModels.find(m => m.value === savedModelValue) || availableModels[0];
    setSelectedModel(defaultModel.value, true); // Initialize selected model and toggle state

    // Event listeners for model modal
    if (customModelSelectorTrigger) {
        customModelSelectorTrigger.addEventListener('click', openModelSelectModal);
    }
    if (closeModelModalButton) {
        closeModelModalButton.addEventListener('click', closeModelSelectModal);
    }
    if (modelSelectModal) {
        modelSelectModal.addEventListener('click', (event) => {
            if (event.target === modelSelectModal) {
                closeModelSelectModal();
            }
        });
    }

    // Event listeners for Fast/Smart toggle
    if (fastButton) {
        fastButton.addEventListener('click', () => {
            setSelectedModel('gemini-1.5-flash-latest', false); // Do not update the toggle from within
            fastButton.classList.add('active');
            smartButton.classList.remove('active');
        });
    }
    if (smartButton) {
        smartButton.addEventListener('click', () => {
            setSelectedModel('gemini-1.5-pro-latest', false); // Do not update the toggle from within
            smartButton.classList.add('active');
            fastButton.classList.remove('active');
        });
    }
    // === AKHIR: CUSTOM SELEKTOR MODEL AI (MODAL) & NEW FAST/SMART TOGGLE ===


    const voiceInputButton = document.getElementById('voiceInputButtonBottom'); // Updated ID
    let recognition;

    // === AWAL: ELEMEN SIDEBAR BARU & FUNGSINYA ===
    const logoutButton = document.getElementById('logoutButton');
    const clearChatHistoryButton = document.getElementById('clearChatHistoryButton');

    // Event Listener untuk Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault(); // Mencegah navigasi default jika itu tautan
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('novaUser');
                window.location.href = 'login.html';
            }
        });
    }

    // Event Listener untuk Hapus Percakapan
    if (clearChatHistoryButton) {
        clearChatHistoryButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
                if (chatHistory) {
                    chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`;
                    const reAddedThinkingIndicator = document.getElementById('thinkingIndicator');
                    if(reAddedThinkingIndicator) thinkingIndicator.style.opacity = '0';
                }
                messageInput.value = '';
                autoResizeTextarea();
                clearAttachedFiles(); // Clear attached files as well
                updateInputAreaAppearance();
                // === Reset conversation history saat hapus percakapan ===
                conversationHistory = [];
                // =======================================================
                showPage('welcome');
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    }

    // Navigasi Sidebar (pastikan ini di dalam DOMContentLoaded)
    document.querySelectorAll('.sidebar-item a').forEach(item => {
        item.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    });
    // === AKHIR: ELEMEN SIDEBAR BARU & FUNGSINYA ===


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
            quickCompleteContainer.classList.remove('active'); // Pastikan quick complete disembunyikan di chat
        } else {
            landingThemeToggleContainer.classList.remove('hidden');
            menuIcon.classList.remove('hidden');
            backIcon.classList.add('hidden');
            // If returning to welcome, quick complete should be hidden anyway by CSS, but good to be explicit
            quickCompleteContainer.classList.remove('active');
        }
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            generateRealAIResponse(initialMessage, attachedFiles);
        }
        updateInputAreaAppearance();
    }

    // Removed placeholder morphing logic
    messageInput.addEventListener('focus', () => {
        // No need to hide quick complete specifically on focus if it's display: none
    });
    messageInput.addEventListener('input', () => {
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
    autoResizeTextarea(); // Initial call to set correct height

    // === Pembersihan Teks AI dari Markdown (menghilangkan bintang dan format lain) ===
    function cleanAiTextFromMarkdown(text) {
        let cleanedText = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
        cleanedText = cleanedText.replace(/(\*|_)(.*?)\1/g, '$2');
        cleanedText = cleanedText.replace(/~~(.*?)~~/g, '$1');
        cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1');
        cleanedText = cleanedText.replace(/^#+\s*(.*)$/gm, '$1');
        cleanedText = cleanedText.replace(/^-+\s*(.*)$/gm, '$1');
        cleanedText = cleanedText.replace(/^\d+\.\s*(.*)$/gm, '$1');
        cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
        
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
        return cleanedText;
    }
    // ======================================================================

    // === Fungsi addChatMessage yang diperbarui untuk Multi-modal Output ===
    function addChatMessage(content, sender = 'user', imageUrl = null, modelTag = "Novaria") { // Tambahkan parameter modelTag
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            messageElement.textContent = content;
            conversationHistory.push({ role: 'user', content: content });
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
            // Use the correct label for the model tag based on `currentSelectedModelValue` or `modelTag` from response
            const actualModelLabel = availableModels.find(m => m.value === modelTag)?.label || modelTag;
            aiModelTagSpan.textContent = actualModelLabel;
            aiHeader.appendChild(aiModelTagSpan);

            messageElement.appendChild(aiHeader);

            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            
            // Tambahkan gambar jika ada
            if (imageUrl) {
                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.alt = "Generated image";
                imgElement.classList.add('ai-generated-image');
                aiContentContainer.appendChild(imgElement);
                if (content.trim()) {
                    const spacer = document.createElement('div');
                    spacer.style.height = '10px';
                    aiContentContainer.appendChild(spacer);
                }
            }

            // Tambahkan teks
            let finalRenderedContent = '';
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
            let lastIndex = 0;

            content.replace(codeBlockRegex, (match, language, code, offset) => {
                const plainTextPart = content.substring(lastIndex, offset);
                finalRenderedContent += `<span>${cleanAiTextFromMarkdown(plainTextPart)}</span>`;

                const lang = language || 'text';
                const escapedCode = code.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const codeHtml = `
                    <div class="code-block">
                        <div class="code-header">
                            <span class="language-tag">${lang}</span>
                            <button class="copy-code-btn" title="Copy code" onclick="copyCode(this)">
                                <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect height="8" width="8" x="8" y="2"/></svg>
                                <span>Copy</span>
                            </button>
                        </div>
                        <pre>${escapedCode}</pre>
                    </div>`;
                finalRenderedContent += codeHtml;
                lastIndex = offset + match.length;
            });

            const remainingText = content.substring(lastIndex);
            if (remainingText) {
                finalRenderedContent += `<span>${cleanAiTextFromMarkdown(remainingText)}</span>`;
            }
            aiContentContainer.innerHTML += finalRenderedContent;
            messageElement.appendChild(aiContentContainer);

            conversationHistory.push({ role: 'assistant', content: content });
        }

        if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
            conversationHistory = conversationHistory.slice(conversationHistory.length - (MAX_HISTORY_LENGTH * 2));
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

        const getResponseTextForSpeak = (contentEl) => {
            let text = '';
            contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SPAN') {
                        text += node.textContent;
                    } else if (node.tagName === 'IMG') {
                        text += `[Gambar: ${node.alt}]`;
                    } else if (node.classList.contains('code-block')) {
                        text += `[Blok kode: ${node.querySelector('pre').textContent}]`;
                    }
                }
            });
            return text.trim();
        };

        const getFullContentForCopy = (contentEl) => {
            let fullContent = '';
             contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    fullContent += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SPAN') {
                        fullContent += node.textContent;
                    } else if (node.tagName === 'IMG') {
                        fullContent += `\n[Gambar: ${node.alt} - URL: ${node.src}]\n`;
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
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, _messageEl) => { const fullContent = getFullContentForCopy(contentContainer); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, _messageEl) => { const textToSpeak = getResponseTextForSpeak(contentContainer); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait';
                const lastUserMessageObj = conversationHistory.slice().reverse().find(msg => msg.role === 'user');
                if (lastUserMessageObj) {
                    msgEl.remove();
                    conversationHistory = conversationHistory.filter(msg => !(msg.role === 'assistant' && msg.content === msgEl.textContent)); // Hapus respons AI terakhir
                    // Jika pesan AI terakhir memiliki gambar, hapus juga dari DOM
                    const lastMessageElement = chatHistory.lastElementChild; // Atau cara lebih spesifik untuk menemukan pesan AI terakhir yang dihapus
                    if (lastMessageElement && lastMessageElement.classList.contains('ai-message')) {
                        const img = lastMessageElement.querySelector('img.ai-generated-image');
                        if (img) img.remove();
                    }

                    generateRealAIResponse(lastUserMessageObj.content, attachedFiles);
                } else {
                    svg.classList.remove('rotating');
                    buttonEl.disabled = false;
                    buttonEl.style.cursor = 'pointer';
                    alert('Tidak ada pesan pengguna sebelumnya untuk meregenerasi respons.');
                }
            } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, _messageEl) => { const fullContent = getFullContentForCopy(contentContainer); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiMessageElement)); actionsContainer.appendChild(button); });
        contentContainer.appendChild(actionsContainer);
        setTimeout(() => { if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
    }

    async function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
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
            const filesAsBase64 = await Promise.all(files.map(async file => {
                const base64Data = await getBase64(file);
                return {
                    data: base64Data,
                    mimeType: file.type
                };
            }));

            const payload = {
                userMessage: userMessage,
                conversationHistory: conversationHistory,
                attachedFiles: filesAsBase64,
                selectedModel: currentSelectedModelValue // Kirim model yang dipilih ke backend
            };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMessageText = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessageText = errorData.message || errorMessageText;
                } catch (jsonError) {
                    const plainTextError = await response.text();
                    errorMessageText = `Server error: ${response.status}. Detail: ${plainTextError.substring(0, 100)}... (bukan JSON)`;
                    console.error("Server returned non-JSON error:", plainTextError);
                }
                throw new Error(errorMessageText);
            }

            const data = await response.json();
            const rawAiResponseText = data.text || '';
            const generatedImageUrl = data.imageUrl || null;
            const modelUsed = data.modelUsed || "Novaria"; // Ambil model yang benar-benar digunakan dari backend

            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');

                let personalizedResponseText = rawAiResponseText;
                if (currentUser && currentUser.name) {
                    const greeting = `Hii ${currentUser.givenName || currentUser.name.split(' ')[0]},\n\n`;
                    personalizedResponseText = greeting + rawAiResponseText;
                }

                // Kirim teks, URL gambar, dan nama model ke addChatMessage
                const aiMessageElement = addChatMessage(personalizedResponseText, 'ai', generatedImageUrl, modelUsed);
                addAiMessageActions(aiMessageElement);
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
        }
    });
    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

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
        conversationHistory = [];
    });

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

    function setupRippleEffects() {
        // Updated query selector to include new button classes
        const clickableElements = document.querySelectorAll('.btn-circle, .btn-plus-top, .btn-voice-bottom, .btn-send-bottom, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .remove-chip-btn, .custom-selector-trigger, .model-option-item, .toggle-button');
        clickableElements.forEach(element => {
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }
            const newHandler = function (e) {
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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
    const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { let needsRippleSetup = false; mutation.addedNodes.forEach(node => { if (node.nodeType === 1) { // Check for new button classes
                        if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn') || node.matches('.remove-chip-btn') || node.matches('.sidebar-item') || node.matches('.model-option-item') || node.matches('.toggle-button'))) {
                            needsRippleSetup = true;
                        } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn') || node.querySelector('.remove-chip-btn') || node.querySelector('.sidebar-item') || node.querySelector('.model-option-item') || node.querySelector('.toggle-button'))) {
                            needsRippleSetup = true;
                        }
                    } }); if (needsRippleSetup) { setupRippleEffects(); } } }); });
    if (chatHistory) observer.observe(chatHistory, { childList: true, subtree: true });
    if (fileChipContainer) observer.observe(fileChipContainer, { childList: true, subtree: true });
    if (sidebar) observer.observe(sidebar, { childList: true, subtree: true });
    if (modelOptionsContainer) observer.observe(modelOptionsContainer, { childList: true, subtree: true }); // Amati perubahan pada modal options
    // Observe the new input wrapper for dynamic height changes
    if (newInputWrapperContainer) observer.observe(newInputWrapperContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });


    // Update padding-bottom for main content based on the new bottom-chat-area height
    function updateInputAreaAppearance() {
        if (!bottomChatArea) return; // Pastikan elemen ada

        const totalBottomSpace = bottomChatArea.offsetHeight + 15; // Jarak dari bottom window + padding
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; // Tambahan 20px buffer

        if (chatHistory) {
            // Scroll to bottom only if user is already near bottom or new message comes in
            const isAtBottom = chatHistory.scrollHeight - chatHistory.scrollTop <= chatHistory.clientHeight + 50; // A bit more tolerance
            if (isAtBottom) {
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        }
    }

    // Panggil updateInputAreaAppearance setiap kali elemen-elemen di bottomChatArea mungkin berubah
    const resizeObserverForBottomArea = new ResizeObserver(() => {
        updateInputAreaAppearance();
    });
    if (bottomChatArea) {
        resizeObserverForBottomArea.observe(bottomChatArea);
    }
    // Also call on input/blur from messageInput if it affects height
    messageInput.addEventListener('input', updateInputAreaAppearance);
    messageInput.addEventListener('blur', updateInputAreaAppearance);
    messageInput.addEventListener('focus', updateInputAreaAppearance);


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

        // Tampilkan area chips jika ada chip
        if (fileChipContainer.children.length > 0) {
            fileChipsArea.style.display = 'flex';
            fileChipContainer.scrollLeft = fileChipContainer.scrollWidth;
        }
        updateInputAreaAppearance(); // Perbarui padding
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
                // Sembunyikan area chips jika tidak ada chip tersisa
                if (fileChipContainer.children.length === 0) {
                    fileChipsArea.style.display = 'none';
                }
                updateInputAreaAppearance(); // Perbarui padding
            }, 300);
        }
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        fileChipContainer.innerHTML = '';
        fileChipsArea.style.display = 'none'; // Pastikan tersembunyi
        updateInputAreaAppearance(); // Perbarui padding
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
    });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';
        recognition.onstart = () => { voiceInputButton.style.backgroundColor = 'red'; messageInput.placeholder = 'Listening...'; };
        recognition.onresult = (event) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } messageInput.value = finalTranscript + interimTranscript; autoResizeTextarea(); };
        recognition.onend = () => { voiceInputButton.style.backgroundColor = ''; if (finalTranscript.trim() !== '') { messageInput.value = finalTranscript.trim(); } if (messageInput.value.trim() === '') { messageInput.placeholder = "Ask me anything..."; } finalTranscript = ''; };
        recognition.onerror = (event) => { voiceInputButton.style.backgroundColor = ''; messageInput.placeholder = "Ask me anything..."; finalTranscript = ''; alert('Speech recognition error: ' + event.error); };
        voiceInputButton.addEventListener('click', () => { try { if (recognition && typeof recognition.stop === 'function' && recognition.recording) { recognition.stop(); } else { recognition.start(); } } catch (e) { if (recognition && typeof recognition.stop === 'function') recognition.stop(); } });
    } else {
        voiceInputButton.style.display = 'none';
    }
});

// Fungsi global untuk copy code tetap ada
function copyCode(buttonElement) {
    const pre = buttonElement.closest('.code-block').querySelector('pre');
    navigator.clipboard.writeText(pre.textContent).then(() => {
        const span = buttonElement.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        setTimeout(() => { span.textContent = originalText; }, 2000);
    }).catch(err => {
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}