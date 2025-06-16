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

    const modelSelectContainer = document.getElementById('modelSelectContainer'); // New
    const modelSelect = document.getElementById('modelSelect');
    const selectedModelDisplay = document.querySelector('.selected-model-display'); // New
    let selectedModel = modelSelect.value;

    let currentActivePage = 'welcome'; // 'welcome' or 'chat'

    // Modal elements
    const infoModalOverlay = document.getElementById('infoModalOverlay');
    const infoModalContent = document.getElementById('infoModalContent');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    // File Upload Elements
    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    const attachedFilesContainer = document.getElementById('attachedFilesContainer');
    const inputWrapper = document.querySelector('.input-wrapper');
    const MAX_FILE_SIZE_KB = 120;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;
    let attachedFiles = [];

    // Voice Input Elements
    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition; // For Web Speech API

    // --- Page State Management ---
    function showPage(pageName, initialMessage = null) {
        if (currentActivePage === pageName) return;

        const currentPageElement = document.getElementById(currentActivePage + 'Section');
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
            setTimeout(() => {
                currentPageElement.classList.add('hidden');
            }, 500); // Match CSS transition duration
        }

        const nextPageElement = document.getElementById(pageName + 'Section');
        if (nextPageElement) {
            nextPageElement.classList.remove('hidden');
            setTimeout(() => {
                nextPageElement.classList.add('active');
            }, 10);
        }

        currentActivePage = pageName;

        // Update header icons and theme toggle visibility
        if (pageName === 'chat') {
            landingThemeToggleContainer.classList.add('hidden');
            modelSelectContainer.classList.add('hidden'); // Hide model select container
            menuIcon.classList.add('hidden'); // Sembunyikan menuIcon di chat page
            backIcon.classList.remove('hidden'); // Tampilkan backIcon di chat page
            // Ensure chat history scrolls to bottom if messages added while hidden
            chatHistory.scrollTop = chatHistory.scrollHeight;
            quickCompleteContainer.classList.remove('active'); // Hide quick complete on chat page
        } else { // 'welcome'
            landingThemeToggleContainer.classList.remove('hidden');
            modelSelectContainer.classList.remove('hidden'); // Show model select container
            menuIcon.classList.remove('hidden'); // Tampilkan menuIcon di welcome page
            backIcon.classList.add('hidden'); // Sembunyikan backIcon di welcome page
            // Show quick suggestions on welcome page if input is empty and no files
            if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                quickCompleteContainer.classList.add('active');
            }
        }

        // Handle initial message for chat page
        if (pageName === 'chat' && initialMessage) {
            addChatMessage(initialMessage, 'user');
            // Simulate AI response based on initial message
            generateRealAIResponse(initialMessage, selectedModel, attachedFiles);
        }
        updateInputAreaPadding();
    }

    // --- Text Morph Animation for Placeholder ---
    const placeholders = {
        en: [
            "Ask me anything...",
            "What's on your mind?",
            "Tell me a story...",
            "How can I help you today?",
            "Start a conversation...",
            "I'm ready to chat!",
            "Let's explore together...",
            "What do you want to learn?"
        ],
        id: [
            "Tanyakan apa saja...",
            "Apa yang ada di pikiranmu?",
            "Ceritakan sebuah kisah...",
            "Bagaimana saya bisa membantumu hari ini?",
            "Mulai percakapan...",
            "Saya siap mengobrol!",
            "Mari jelajahi bersama...",
            "Apa yang ingin kamu pelajari?"
        ]
    };
    let currentPlaceholderIndex = 0;
    let currentLanguage = localStorage.getItem('novaai_language') || 'en';

    function animatePlaceholder() {
        if (messageInput.value.trim() !== '') {
            return;
        }

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
    animatePlaceholder(); // Call once initially

    // Stop placeholder animation when user types
    messageInput.addEventListener('focus', () => {
        clearInterval(placeholderInterval);
        quickCompleteContainer.classList.remove('active');
    });

    messageInput.addEventListener('blur', () => {
        // Restart if input is empty and no files are attached
        if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
            placeholderInterval = setInterval(animatePlaceholder, 3000);
            if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            }
        }
    });
    messageInput.addEventListener('input', () => {
        // Hide quick complete if user starts typing OR if files are attached
        if (messageInput.value.trim() !== '' || attachedFiles.length > 0) {
            quickCompleteContainer.classList.remove('active');
        } else {
            if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            }
        }
        autoResizeTextarea(); // autoResizeTextarea already calls updateInputAreaPadding
    });

    // --- Auto-resize textarea ---
    function autoResizeTextarea() {
        messageInput.style.height = 'auto'; // Reset height to recalculate
        messageInput.style.height = messageInput.scrollHeight + 'px'; // Set to scroll height

        // Update input wrapper height based on textarea height
        const computedStyle = getComputedStyle(messageInput);
        const inputPadding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
        const newWrapperHeight = messageInput.scrollHeight + (10 * 2); // 10px top/bottom padding on wrapper
        inputWrapper.style.height = `${Math.min(newWrapperHeight, 160)}px`; // Cap at max-height

        updateInputAreaPadding();
    }

    messageInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea(); // Initial call to set correct height

    // --- Add Chat Message to History (No Bubbles) ---
    function addChatMessage(message, sender = 'user') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        if (sender === 'user') {
            messageElement.classList.add('user-message');
            messageElement.textContent = message;
        } else { // AI message will be typed out
            messageElement.classList.add('ai-message');
            // Text will be added by typeMessage function
        }
        chatHistory.appendChild(messageElement);

        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return messageElement; // Return the element for typing animation
    }

    // --- Type Out Message Animation ---
    function typeMessage(element, text, delay = 20) {
        let i = 0;
        element.textContent = ''; // Clear content for typing
        const textContentContainer = document.createElement('span'); // Container for plain text
        element.appendChild(textContentContainer);

        // Regex to find code blocks: ```[language]\n[code]```
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let typedText = '';

        const renderTextPart = (part) => {
            textContentContainer.textContent = part;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        };

        const typeMessageTick = () => { // Helper function for interval
            if (i < text.length) {
                typedText += text.charAt(i);

                // Check for complete code blocks as we type
                let tempTypedText = typedText;
                let currentCodeBlockMatch;
                const matches = [];
                // Collect all matches in the current typed text to avoid issues with exec() and global flag
                while ((currentCodeBlockMatch = codeBlockRegex.exec(tempTypedText)) !== null) {
                    matches.push({
                        match: currentCodeBlockMatch[0],
                        language: currentCodeBlockMatch[1] || 'text',
                        code: currentCodeBlockMatch[2],
                        index: currentCodeBlockMatch.index,
                        fullLength: currentCodeBlockMatch[0].length
                    });
                }

                if (matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    const codeBlockEndIndex = lastMatch.index + lastMatch.fullLength;

                    if (codeBlockEndIndex <= typedText.length) { // If a code block is complete
                        clearInterval(interval); // Stop typing for a moment

                        const preCodeText = typedText.substring(lastIndex, lastMatch.index);
                        textContentContainer.textContent = preCodeText; // Render text before the code block

                        addCodeBlock(element, lastMatch.code, lastMatch.language);

                        lastIndex = codeBlockEndIndex;
                        typedText = typedText.substring(lastIndex); // Continue typing from after the code block
                        i = text.indexOf(typedText, lastIndex - typedText.length); // Adjust index based on remaining text (approx)
                        if (i === -1 || i < lastIndex) i = lastIndex; // Ensure index doesn't go backwards

                        // Restart typing from after the code block
                        setTimeout(() => {
                            if (i < text.length) {
                                interval = setInterval(typeMessageTick, delay);
                            } else {
                                // After all text is typed and code blocks added, add action buttons
                                addAiMessageActions(element);
                            }
                        }, 10); // Small delay before restarting typing
                        return; // Exit this tick, continue in the next interval
                    }
                }

                renderTextPart(typedText); // Render the current typed text
                i++;
            } else {
                clearInterval(interval);
                // Render any remaining plain text after all code blocks are processed
                renderTextPart(typedText);
                addAiMessageActions(element); // Add action buttons after all content is typed
            }
        };

        let interval = setInterval(typeMessageTick, delay);
    }


    // Helper for code block creation (called by typeMessage)
    function addCodeBlock(parentElement, code, language) {
        const codeBlockDiv = document.createElement('div');
        codeBlockDiv.classList.add('code-block');

        const header = document.createElement('div');
        header.classList.add('code-header');

        const languageTag = document.createElement('span');
        languageTag.classList.add('language-tag');
        languageTag.textContent = language;
        header.appendChild(languageTag);

        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-code-btn');
        copyButton.innerHTML = `
            <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect height="8" width="8" x="8" y="2"/>
            </svg>
            <span>Copy</span>
        `;
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
                copyButton.querySelector('span').textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.querySelector('span').textContent = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
        header.appendChild(copyButton);
        codeBlockDiv.appendChild(header);

        const pre = document.createElement('pre');
        pre.textContent = code;
        codeBlockDiv.appendChild(pre);

        parentElement.appendChild(codeBlockDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll after adding code block
    }

    // Helper for AI Message Action Buttons
    function addAiMessageActions(aiMessageElement) {
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

        const buttons = [
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
                title: 'Copy Response',
                action: (el) => {
                    const textContent = el.querySelector('span') ? el.querySelector('span').textContent : el.textContent; // Get main text content
                    let fullContent = textContent;
                    el.querySelectorAll('.code-block pre').forEach(codeEl => {
                        fullContent += '\n\n```\n' + codeEl.textContent + '\n```'; // Add code blocks
                    });
                    navigator.clipboard.writeText(fullContent).then(() => {
                        alert('Response copied!');
                    }).catch(err => console.error('Failed to copy: ', err));
                }
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-share-2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
                title: 'Share',
                action: (el) => {
                    const textContent = el.querySelector('span') ? el.querySelector('span').textContent : el.textContent;
                    if (navigator.share) {
                        navigator.share({
                            title: 'NovaAI Response',
                            text: textContent,
                            url: window.location.href,
                        }).catch((error) => console.log('Error sharing', error));
                    } else {
                        alert('Share API not supported in this browser.');
                    }
                }
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>',
                title: 'Like',
                action: (el) => {
                    alert('Liked!'); // Placeholder for like functionality
                }
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.5 13H12a8 8 0 0 0 0-16 8 8 0 0 1 8 8v1"></path></svg>',
                title: 'Regenerate',
                action: (el) => {
                    const lastUserMessage = chatHistory.querySelector('.user-message:last-child');
                    if (lastUserMessage) {
                        // Remove the current AI response and regenerate
                        el.remove(); // Remove the current AI response
                        generateRealAIResponse(lastUserMessage.textContent, selectedModel, attachedFiles);
                    } else {
                        alert('No previous user message to regenerate from.');
                    }
                }
            }
        ];

        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.classList.add('ai-action-btn');
            button.title = btnInfo.title;
            button.innerHTML = btnInfo.icon;
            button.addEventListener('click', () => btnInfo.action(aiMessageElement)); // Pass the AI message element
            actionsContainer.appendChild(button);
        });
        aiMessageElement.appendChild(actionsContainer);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }


    // Real API integration (placeholders for API Keys and actual logic)
    async function generateRealAIResponse(userMessage, model, files = []) {
        thinkingIndicator.classList.remove('hidden');
        thinkingIndicator.style.opacity = '1';
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            let responseText = '';
            const messages = [{ role: "user", content: userMessage }];

            if (files.length > 0) {
                const fileInfo = files.map(f => `${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join(', ');
                messages[0].content += `\n\n(Pengguna juga menyertakan file ini: ${fileInfo}. Mohon analisis atau respons berdasarkan mereka jika berlaku, jika tidak, abaikan untuk interaksi berbasis teks ini.)`;
            }

            switch (model) {
                case 'cohere':
                    responseText = await callCohereAPI(messages[0].content);
                    break;
                case 'gemini':
                    const geminiContents = [{ parts: [{ text: messages[0].content }] }];
                    responseText = await callGeminiAPI(geminiContents);
                    break;
                case 'copilot':
                    responseText = await callCopilotAPI(messages);
                    break;
                default:
                    throw new Error('Invalid model selected');
            }

            thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                thinkingIndicator.classList.add('hidden');
                const aiMessageElement = addChatMessage('', 'ai');
                typeMessage(aiMessageElement, responseText, 30);
                clearAttachedFiles(); // Clear attached files after successful response
            }, 300);

        } catch (error) {
            console.error('API Error:', error);
            thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                thinkingIndicator.classList.add('hidden');
                const errorMessage = `Maaf, saya mengalami kesalahan saat menghubungi AI (${error.message}). Silakan coba lagi.`;
                const aiMessageElement = addChatMessage(errorMessage, 'ai');
                clearAttachedFiles(); // Clear attached files even if error occurs
            }, 300);
        }
    }

    // API Call Functions - Ganti dengan API Keys Anda!
    // PERINGATAN: Kunci API ini harus diamankan di backend dan tidak boleh diekspos di frontend dalam produksi.
    // Ini hanya untuk tujuan demonstrasi.
    async function callCohereAPI(prompt) {
        // Replace 'YOUR_COHERE_API_KEY' with your actual Cohere API Key
        const response = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 5bfTFQ37iHywriVvhj4lCbg1jIXZXtvcd9s9L0MU`, // Ganti dengan kunci API Cohere Anda
                'Cohere-Version': '2024-02-15'
            },
            body: JSON.stringify({
                model: "command-r-plus", // Atau model Cohere lain yang Anda inginkan
                message: prompt,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cohere API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        const data = await response.json();
        return data.text;
    }

    async function callGeminiAPI(contents) {
        // Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API Key
        // Pastikan Anda mengaktifkan Gemini API di Google Cloud Project Anda
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyD481M4LsysCaLxoWkgP4Vb5RkOLwo2dMk`, { // Ganti dengan kunci API Gemini Anda
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents // 'contents' array with 'parts' is expected
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Invalid response format from Gemini API");
        }
    }

    async function callCopilotAPI(messages) {
        // NOTE: Akses ke GitHub Copilot API biasanya memerlukan otorisasi GitHub yang spesifik.
        // Kunci yang Anda berikan adalah placeholder. Dalam aplikasi nyata, ini harus ditangani di backend
        // dengan token OAuth yang valid atau melalui API Gateway.
        const response = await fetch('https://api.githubcopilot.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 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`, // Ganti dengan token yang valid (biasanya dari backend)
                'GitHub-Copilot-API-Version': '2024-05-01' // Pastikan versi API terbaru
            },
            body: JSON.stringify({
                model: "gpt-4-copilot", // Model yang tersedia di Copilot
                messages: messages,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Copilot API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Invalid response format from Copilot API");
        }
    }


    // --- Send Button Functionality ---
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message !== '' || attachedFiles.length > 0) { // Kirim jika ada pesan ATAU file terlampir
            let finalPrompt = message;
            if (attachedFiles.length > 0 && message === '') {
                // Jika hanya ada file, buat prompt sederhana
                const fileNames = attachedFiles.map(f => f.name).join(', ');
                finalPrompt = `Harap menganalisis file-file ini: ${fileNames}`;
            } else if (attachedFiles.length > 0) {
                // Jika ada pesan dan file, tambahkan info file ke pesan
                const fileNames = attachedFiles.map(f => f.name).join(', ');
                finalPrompt = `${message} (Dilampirkan: ${fileNames})`;
            }

            if (currentActivePage === 'welcome') {
                showPage('chat', finalPrompt);
            } else {
                addChatMessage(message, 'user');
                generateRealAIResponse(message, selectedModel, attachedFiles);
            }
            messageInput.value = '';
            autoResizeTextarea();
            // Adjust quick complete visibility based on current state
            if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
            } else {
                quickCompleteContainer.classList.remove('active');
            }
        }
    });

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // --- Handle Initial Message from Landing Page (if user clicked 'send' from welcome and then refreshed) ---
    // This part might need adjustment if you're managing persistent chat sessions
    const initialChatMessageFromStorage = localStorage.getItem('initialChatMessage');
    if (initialChatMessageFromStorage) {
        localStorage.removeItem('initialChatMessage');
        showPage('chat', initialChatMessageFromStorage);
    } else {
        showPage('welcome');
    }

    // --- Sidebar Toggle ---
    menuIcon.addEventListener('click', () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });

    // --- Back Icon Functionality ---
    backIcon.addEventListener('click', () => {
        showPage('welcome'); // Kembali ke halaman welcome
        chatHistory.innerHTML = `<div id="thinkingIndicator" class="ai-message hidden"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`; // Kosongkan chat history
        messageInput.value = ''; // Kosongkan input
        attachedFiles = []; // Hapus file terlampir
        attachedFilesContainer.innerHTML = ''; // Kosongkan container file
        updateInputAreaPadding(); // Perbarui padding
        if (currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active'); // Tampilkan kembali quick complete
        }
    });

    // --- Theme Toggle (Dark/Light Mode) ---
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
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('novaai_theme', 'light-mode');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('novaai_theme', 'dark-mode');
        }
        themeToggle.checked = isLightMode;
        themeToggleLanding.checked = isLightMode;
    }

    themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));
    themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));


    // --- Language Selection and Translation ---
    const translations = {
        en: {
            documentTitle: "NovaAI",
            welcomeTitle: "Welcome",
            helpText: "Hii, I Can Help You?",
            languageOption: "Language",
            themeMode: "Dark / Light Mode",
            privacyPolicy: "Privacy Policy",
            termsAndConditions: "Terms & Conditions",
            policy: "Policy",
            aboutUs: "About Us",
            settingsTitle: "Settings",
            quickSuggestions: [
                "What's the weather like today?",
                "Tell me a fun fact about space.",
                "Explain AI in simple terms.",
                "Give me a recipe for cookies."
            ],
            // Modal Content Translations
            privacyPolicyContent: `
            <h3>Privacy Policy</h3>
            <p>Your privacy is important to us. It is NovaAI's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
            <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
            <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
            <p>Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p>
            <p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p>
            <p>Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p>
            <p>This policy is effective as of June 7, 2025.</p>
          `,
            termsAndConditionsContent: `
            <h3>Terms & Conditions</h3>
            <p>Welcome to NovaAI. By accessing or using our services, you agree to be bound by these Terms and Conditions.</p>
            <p>These Terms apply to all visitors, users and others who access or use the Service.</p>
            <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>
            <h4>Intellectual Property</h4>
            <p>The Service and its original content, features and functionality are and will remain the exclusive property of NovaAI and its licensors. The Service is protected by copyright, trademark, and other laws of both the Indonesia and foreign countries.</p>
            <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by NovaAI.</p>
            <p>NovaAI has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p>
            <p>We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.</p>
            <p>This document was last updated on June 7, 2025.</p>
          `,
            policyContent: `
            <h3>Policy</h3>
            <p>This document outlines the general policies governing the use of NovaAI services.</p>
            <p>1. **Acceptable Use:** Users must not use NovaAI for any unlawful or prohibited activities. This includes, but is not limited to, spamming, transmitting harmful code, or infringing on intellectual property rights.</p>
            <p>2. **Content:** Users are solely responsible for the content they submit through NovaAI. NovaAI does not endorse or assume responsibility for any user-generated content.</p>
            <p>3. **Service Availability:** While we strive for 24/7 availability, NovaAI may be temporarily unavailable due to maintenance, upgrades, or unforeseen technical issues.</p>
            <p>4. **Modifications to Service:** NovaAI reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.</p>
            <p>For more detailed information, please refer to our Terms & Conditions and Privacy Policy.</p>
            <p>Last modified: June 7, 2025.</p>
          `,
            aboutUsContent: `
            <h3>About Us</h3>
            <p>NovaAI is an innovative AI assistant designed to simplify your daily tasks and provide quick, accurate information.</p>
            <p>Our mission is to make advanced AI accessible and user-friendly for everyone. We believe in the power of artificial intelligence to enhance productivity, foster learning, and spark creativity.</p>
            <p>Developed with a focus on privacy and user experience, NovaAI continuously evolves to meet the needs of our users. We are committed to transparency and providing a reliable service.</p>
            <p>Thank you for choosing NovaAI. We're excited to grow and improve with your feedback.</p>
            <p>Founded: 2025</p>
          `
        },
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
            privacyPolicyContent: `
            <h3>Kebijakan Privasi</h3>
            <p>Privasi Anda penting bagi kami. Kebijakan NovaAI adalah untuk menghormati privasi Anda terkait informasi apa pun yang mungkin kami kumpulkan dari Anda di seluruh situs web kami, dan situs lain yang kami miliki dan operasikan.</p>
            <p>Kami hanya meminta informasi pribadi jika kami benar-benar membutuhkannya untuk menyediakan layanan kepada Anda. Kami mengumpulkannya dengan cara yang adil dan sah, dengan pengetahuan dan persetujuan Anda. Kami juga memberi tahu Anda mengapa kami mengumpulkannya dan bagaimana itu akan digunakan.</p>
            <p>Kami hanya menyimpan informasi yang dikumpulkan selama diperlukan untuk menyediakan layanan yang Anda minta. Data yang kami simpan, akan kami lindungi dengan cara yang dapat diterima secara komersial untuk mencegah kehilangan dan pencurian, serta akses, pengungkapan, penyalinan, penggunaan atau modifikasi yang tidak sah.</p>
            <p>Kami tidak membagikan informasi identitas pribadi secara publik atau dengan pihak ketiga, kecuali jika diwajibkan oleh hukum.</p>
            <p>Situs web kami dapat menautkan ke situs eksternal yang tidak dioperasikan oleh kami. Perlu diketahui bahwa kami tidak memiliki kendali atas konten dan praktik situs-situs ini, dan tidak dapat menerima tanggung jawab atas kebijakan privasi masing-masing.</p>
            <p>Anda bebas untuk menolak permintaan kami untuk informasi pribadi Anda, dengan pemahaman bahwa kami mungkin tidak dapat menyediakan beberapa layanan yang Anda inginkan.</p>
            <p>Penggunaan Anda yang berkelanjutan atas situs web kami akan dianggap sebagai penerimaan praktik kami seputar privasi dan informasi pribadi. Jika Anda memiliki pertanyaan tentang bagaimana kami menangani data pengguna dan informasi pribadi, jangan ragu untuk menghubungi kami.</p>
            <p>Kebijakan ini berlaku efektif mulai 7 Juni 2025.</p>
          `,
            termsAndConditionsContent: `
            <h3>Syarat & Ketentuan</h3>
            <p>Selamat datang di NovaAI. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat dengan Syarat dan Ketentuan ini.</p>
            <p>Ketentuan ini berlaku untuk semua pengunjung, pengguna, dan pihak lain yang mengakses atau menggunakan Layanan.</p>
            <p>Dengan mengakses atau menggunakan Layanan, Anda setuju untuk terikat dengan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan, maka Anda tidak boleh mengakses Layanan.</p>
            <h4>Kekayaan Intelektual</h4>
            <p>Layanan dan konten asli, fitur, dan fungsionalitasnya adalah dan akan tetap menjadi milik eksklusif NovaAI dan pemberi lisensinya. Layanan ini dilindungi oleh hak cipta, merek dagang, dan undang-undang lain baik di Indonesia maupun negara asing.</p>
            <p>Layanan kami mungkin berisi tautan ke situs web atau layanan pihak ketiga yang tidak dimiliki atau dikendalikan oleh NovaAI.</p>
            <p>NovaAI tidak memiliki kendali atas, dan tidak bertanggung jawab atas, konten, kebijakan privasi, atau praktik situs web atau layanan pihak ketiga mana pun.</p>
            <p>Kami sangat menyarankan Anda untuk membaca syarat dan ketentuan serta kebijakan privasi situs web atau layanan pihak ketiga mana pun yang Anda kunjungi.</p>
            <p>Dokumen ini terakhir diperbarui pada 7 Juni 2025.</p>
          `,
            policyContent: `
            <h3>Kebijakan</h3>
            <p>Dokumen ini menguraikan kebijakan umum yang mengatur penggunaan layanan NovaAI.</p>
            <p>1. **Penggunaan yang Dapat Diterima:** Pengguna tidak boleh menggunakan NovaAI untuk kegiatan yang melanggar hukum atau dilarang. Ini termasuk, namun tidak terbatas pada, spamming, transmisi kode berbahaya, atau pelanggaran hak kekayaan intelektual.</p>
            <p>2. **Konten:** Pengguna sepenuhnya bertanggung jawab atas konten yang mereka kirimkan melalui NovaAI. NovaAI tidak mendukung atau bertanggung jawab atas konten yang dibuat oleh pengguna.</p>
            <p>3. **Service Availability:** Meskipun kami berusaha untuk ketersediaan 24/7, NovaAI mungkin sementara tidak tersedia karena pemeliharaan, peningkatan, atau masalah teknis yang tidak terduga.</p>
            <p>4. **Modifikasi Layanan:** NovaAI berhak untuk memodifikasi atau menghentikan, sementara atau permanen, Layanan (atau bagian darinya) dengan atau tanpa pemberitahuan.</p>
            <p>Untuk informasi lebih lanjut, silakan lihat Syarat & Ketentuan dan Kebijakan Privasi kami.</p>
            <p>Terakhir dimodifikasi: 7 Juni 2025.</p>
          `,
            aboutUsContent: `
            <h3>Tentang Kami</h3>
            <p>NovaAI adalah asisten AI inovatif yang dirancang untuk menyederhanakan tugas harian Anda dan memberikan informasi yang cepat dan akurat.</p>
            <p>Misi kami adalah membuat AI canggih dapat diakses dan mudah digunakan untuk semua orang. Kami percaya pada kekuatan kecerdasan buatan untuk meningkatkan produktivitas, mendorong pembelajaran, dan memicu kreativitas.</p>
            <p>Developed with a focus on privacy and user experience, NovaAI continuously evolves to meet the needs of our users. We are committed to transparency and providing a reliable service.</p>
            <p>Thank you for choosing NovaAI. We're excited to grow and improve with your feedback.</p>
            <p>Founded: 2025</p>
          `
        }
    };

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

    // --- Quick Suggestions Functionality ---
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
                    generateRealAIResponse(suggestionText, selectedModel);
                }
                messageInput.value = '';
                autoResizeTextarea();
                messageInput.focus();
                clearInterval(placeholderInterval);
                quickCompleteContainer.classList.remove('active');
            });
            quickCompleteContainer.appendChild(button);
        });
        // Show quick suggestions initially if input is empty and on welcome page and no files
        if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    }

    // Initialize language from localStorage or default
    languageSelect.value = currentLanguage;
    updateTextContent(currentLanguage);

    languageSelect.addEventListener('change', (event) => {
        currentLanguage = event.target.value;
        localStorage.setItem('novaai_language', currentLanguage);
        updateTextContent(currentLanguage);
        animatePlaceholder();
        // Update language for speech recognition if available
        if (recognition) {
            recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US';
        }
    });

    // --- Modal/Popup Functionality ---
    function openModal(titleKey, contentKey) {
        modalTitle.textContent = translations[currentLanguage][titleKey];
        modalBody.innerHTML = translations[currentLanguage][contentKey];
        infoModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        infoModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalCloseBtn.addEventListener('click', closeModal);
    infoModalOverlay.addEventListener('click', (e) => {
        if (e.target === infoModalOverlay) {
            closeModal();
        }
    });

    // Handle sidebar item clicks to open modal
    document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');

            const targetKey = this.dataset.modalTarget;
            const titleKey = targetKey;
            const contentKey = targetKey + 'Content';

            openModal(titleKey, contentKey);
        });
    });

    // --- Ripple Effect for Buttons and Clickable Items ---
    function setupRippleEffects() {
        const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .model-select-container'); // Added new buttons

        clickableElements.forEach(element => {
            // Remove old handler if it exists to prevent duplicate event listeners
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }

            const newHandler = function (e) {
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
            element._rippleHandler = newHandler; // Store the handler
        });
    }
    setupRippleEffects(); // Call once initially

    // Re-setup ripple effects after content changes if needed
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const newActionButtons = Array.from(mutation.addedNodes).some(node => node.querySelector && node.querySelector('.ai-action-btn'));
                const newCodeBlocks = Array.from(mutation.addedNodes).some(node => node.querySelector && node.querySelector('.copy-code-btn'));
                if (newActionButtons || newCodeBlocks) {
                    setupRippleEffects(); // Re-apply ripple effects
                }
            }
        });
    });
    observer.observe(chatHistory, { childList: true, subtree: true });


    // --- Model Selection Logic (Custom Dropdown) ---
    modelSelectContainer.addEventListener('click', (event) => {
        // Prevent event from bubbling up to document click listener if select is already open
        event.stopPropagation();
        modelSelect.classList.toggle('hidden'); // Toggle visibility of the actual select
        modelSelectContainer.classList.toggle('open'); // Toggle class for arrow rotation
        if (!modelSelect.classList.contains('hidden')) {
            modelSelect.focus(); // Focus the select element when it's made visible
            const option = modelSelect.querySelector(`option[value="${modelSelect.value}"]`);
            if (option) {
                option.selected = true; // Ensure the correct option is visually selected
            }
        }
    });

    modelSelect.addEventListener('change', (event) => {
        selectedModel = event.target.value;
        selectedModelDisplay.textContent = selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1); // Update display text
        console.log(`Model changed to: ${selectedModel}`);
        modelSelect.classList.add('hidden'); // Hide select after selection
        modelSelectContainer.classList.remove('open'); // Reset arrow
    });

    // Hide select when clicking outside
    document.addEventListener('click', (event) => {
        if (!modelSelectContainer.contains(event.target)) {
            modelSelect.classList.add('hidden');
            modelSelectContainer.classList.remove('open');
        }
    });

    // NEW: Update input area and quick complete padding based on current elements
    function updateInputAreaPadding() {
        const inputWrapperHeight = inputWrapper.offsetHeight;
        const attachedFilesHeight = attachedFilesContainer.offsetHeight; // This will be 0 if display:none
        const attachedFilesIsVisible = attachedFilesContainer.children.length > 0; // Check if children exist
        const fileContainerActualHeight = attachedFilesIsVisible ? attachedFilesHeight + 10 : 0; // 10px gap if visible

        const totalBottomSpace = inputWrapperHeight + 15 + fileContainerActualHeight; // 15px default bottom spacing for input-wrapper

        // quickCompleteContainer is now absolutely positioned, no longer dependent on bottom padding calculation in this way
        // mainContent still needs padding
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; // Add extra padding for comfortable viewing

        // Ensure chat history scrolls to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // NEW: File Upload Logic
    plusButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`File "${file.name}" (${(file.size / 1024).toFixed(2)} KB) melebihi ukuran maksimum ${MAX_FILE_SIZE_KB} KB.`);
                } else {
                    const isDuplicate = attachedFiles.some(f => f.name === file.name && f.size === file.size); // Check name and size for better duplication check
                    if (!isDuplicate) {
                        attachedFiles.push(file);
                        displayAttachedFile(file);
                    } else {
                        alert(`File "${file.name}" sudah dilampirkan.`);
                    }
                }
            });
            fileInput.value = ''; // Clear input to allow re-selection of same file
            quickCompleteContainer.classList.remove('active'); // Hide quick complete when files are attached
            updateInputAreaPadding();
        }
    });

    function displayAttachedFile(file) {
        const fileItem = document.createElement('div');
        fileItem.classList.add('attached-file-item');
        fileItem.dataset.fileName = file.name;
        fileItem.dataset.fileSize = file.size; // Store size to aid duplication check

        const fileInfo = document.createElement('div');
        fileInfo.classList.add('file-info');
        fileInfo.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
        `;
        fileItem.appendChild(fileInfo);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-file-btn');
        removeButton.innerHTML = '&times;';
        removeButton.title = `Hapus ${file.name}`;
        removeButton.addEventListener('click', () => {
            removeAttachedFile(file.name, file.size);
        });
        fileItem.appendChild(removeButton);

        attachedFilesContainer.appendChild(fileItem);
        updateInputAreaPadding();
    }

    function removeAttachedFile(fileName, fileSize) {
        attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSize));
        const fileItemToRemove = document.querySelector(`.attached-file-item[data-file-name="${fileName}"][data-file-size="${fileSize}"]`);
        if (fileItemToRemove) {
            fileItemToRemove.remove();
        }
        // Re-evaluate quick complete visibility
        if (attachedFiles.length === 0 && messageInput.value.trim() === '' && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
        updateInputAreaPadding();
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        attachedFilesContainer.innerHTML = '';
        updateInputAreaPadding();
        // Re-evaluate quick complete visibility
        if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    }

    // NEW: Voice Input (Web Speech API)
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();

        // Optional: Set language for recognition
        recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US';

        recognition.continuous = false; // Stop after first result
        recognition.interimResults = true; // Get results as they come

        let finalTranscript = '';

        recognition.onstart = () => {
            console.log('Voice recognition started.');
            voiceInputButton.style.backgroundColor = 'red'; // Indicate recording
            messageInput.placeholder = 'Listening...';
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
            voiceInputButton.style.backgroundColor = ''; // Reset button color
            if (finalTranscript.trim() !== '') {
                messageInput.value = finalTranscript.trim();
                sendButton.click(); // Automatically send after voice input
            }
            messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex]; // Restore placeholder
            finalTranscript = ''; // Reset for next recognition
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceInputButton.style.backgroundColor = ''; // Reset button color
            messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex]; // Restore placeholder
            finalTranscript = ''; // Reset for next recognition
            alert('Speech recognition error: ' + event.error);
        };

        voiceInputButton.addEventListener('click', () => {
            try {
                recognition.start();
            } catch (e) {
                console.warn('Recognition already started or other error:', e);
                recognition.stop(); // Try to stop if already started
            }
        });
    } else {
        voiceInputButton.style.display = 'none'; // Hide button if API not supported
        console.warn('Web Speech API not supported in this browser.');
    }

    // Initial page load visibility based on current page
    showPage(currentActivePage);
});