// === FULL MODIFIED SCRIPT.JS ===
// Updated to include conversation history in API calls

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
    const menuIcon = document.getElementById('menuIcon'); // Updated ID
    const backIcon = document.getElementById('backIcon');
    const homeIcon = document.getElementById('homeIcon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const themeToggleLanding = document.getElementById('themeToggleLanding');
    const quickCompleteContainer = document.getElementById('quickCompleteContainer');
    const chatHistoryElement = document.getElementById('chatHistory');
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
    const sidebarChatHistoryElement = document.getElementById('sidebarChatHistory');
    const newChatButton = document.getElementById('newChatButton');
    const deleteHistoryIcon = document.getElementById('deleteHistoryIcon');
    const newChatHeaderIcon = document.getElementById('newChatHeaderIcon'); // New chat icon in header

    let chatHistories = loadChatHistories();
    let currentChatId = null;

    // Konfigurasi jumlah pesan history yang dikirim ke API
    const MAX_MESSAGES_FOR_CONTEXT = 20; // Ambil 20 pesan terakhir (10 pasang user/AI)

    function loadChatHistories() {
        const storedHistories = localStorage.getItem('novaai_chat_histories');
        try {
            return storedHistories ? JSON.parse(storedHistories) : [];
        } catch (e) {
            console.error("Error parsing chat histories from localStorage:", e);
            return [];
        }
    }

    function saveChatHistories() {
        localStorage.setItem('novaai_chat_histories', JSON.stringify(chatHistories));
    }

    function renderChatHistoryList() {
        if (!sidebarChatHistoryElement) return;

        sidebarChatHistoryElement.innerHTML = '';

        if (chatHistories.length === 0) {
            sidebarChatHistoryElement.innerHTML = '<div style="text-align: center; opacity: 0.7; margin-top: 20px; font-size: 0.9em;">No chat history yet.</div>';
            deleteHistoryIcon.classList.add('hidden');
            return;
        } else {
             deleteHistoryIcon.classList.remove('hidden');
        }

        // Sort by timestamp descending
        const sortedHistories = chatHistories.sort((a, b) => b.timestamp - a.timestamp);


        sortedHistories.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            if (history.id === currentChatId) {
                historyItem.classList.add('active');
            }
            historyItem.dataset.chatId = history.id;

            const titleSpan = document.createElement('span');
            titleSpan.classList.add('history-item-title');
            // Use title or first user message as title
             const displayTitle = history.title || (history.messages.length > 0 ? history.messages[0].content.substring(0, 40) + (history.messages[0].content.length > 40 ? '...' : '') : 'New Chat');
            titleSpan.textContent = displayTitle;
            historyItem.appendChild(titleSpan);

            // Optional: Options icon (e.g., 3 dots) can be added here

            historyItem.addEventListener('click', () => {
                loadChatHistory(history.id);
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });

            sidebarChatHistoryElement.appendChild(historyItem);
        });
    }

    function startNewChat() {
        // Save current chat if it has messages before starting a new one
        if (currentChatId !== null && chatHistories.find(h => h.id === currentChatId)?.messages.length > 0) {
             // Logic to save the *current* state might be needed if you allow leaving a chat mid-response
             // For now, we assume chat is saved after AI response.
             // If user starts new chat *before* AI responds, the previous chat won't be saved automatically here.
        }

        currentChatId = null;
        localStorage.removeItem('novaai_last_active_chat_id'); // Clear last active chat
        clearChatDisplay();

        // If currently on chat page, transition back to welcome
        if (currentActivePage !== 'welcome') {
             showPage('welcome');
        }

        // Clear attached files UI
        clearAttachedFiles();
        updateInputAreaAppearance();

        // Reset placeholder and quick suggestions state
        startPlaceholderAnimation();
        if (currentActivePage === 'welcome') {
             quickCompleteContainer.classList.add('active');
         }


        renderChatHistoryList(); // Update sidebar list to show no active chat
    }

    function loadChatHistory(chatId) {
        const historyToLoad = chatHistories.find(history => history.id === chatId);
        if (historyToLoad) {
            // Save current chat state before loading a new one if necessary
            // ... (add save logic here if needed)

            currentChatId = chatId;
            localStorage.setItem('novaai_last_active_chat_id', chatId); // Save last active chat
            clearChatDisplay();
            historyToLoad.messages.forEach(msg => {
                 // Use innerHTML for messages assuming they are stored as sanitized HTML
                 // This might need adjustment if you store raw markdown/text
                addChatMessage(msg.content, msg.sender);
            });
            // Re-add actions to AI messages after loading
            chatHistoryElement.querySelectorAll('.ai-message').forEach(msgEl => {
                addAiMessageActions(msgEl);
            });

             showPage('chat');
             clearAttachedFiles(); // Clear file attachments when loading history
             updateInputAreaAppearance();
             quickCompleteContainer.classList.remove('active'); // Hide quick suggestions in chat mode
             renderChatHistoryList(); // Update active item in sidebar

        } else {
            console.warn("Chat history not found with ID:", chatId);
             // If loading fails, perhaps start a new chat
             startNewChat();
        }
    }

     // Function to add messages to the *current* chat history object
     function addMessageToCurrentChatHistory(sender, content) {
         if (currentChatId === null) {
             // If no active chat, create a new one
             currentChatId = Date.now(); // New ID
             const newHistory = {
                 id: currentChatId,
                 title: '', // Title will be set after the first AI response
                 messages: [],
                 timestamp: Date.now()
             };
             chatHistories.unshift(newHistory); // Add at the beginning
             localStorage.setItem('novaai_last_active_chat_id', currentChatId); // Set as last active
         }

         const activeHistory = chatHistories.find(h => h.id === currentChatId);
         if (activeHistory) {
             activeHistory.messages.push({ sender: sender, content: content });
             activeHistory.timestamp = Date.now(); // Update timestamp

             // Set/update title after the first AI response
             if (sender === 'ai' && !activeHistory.title) {
                  // Find the corresponding user message
                  const userMsgIndex = activeHistory.messages.findIndex(msg => msg.sender === 'user');
                  if(userMsgIndex !== -1) {
                      activeHistory.title = activeHistory.messages[userMsgIndex].content.substring(0, 50) + (activeHistory.messages[userMsgIndex].content.length > 50 ? '...' : '');
                  }
             }

             saveChatHistories(); // Save to localStorage
             renderChatHistoryList(); // Update sidebar
         }
     }


    function clearChatDisplay() {
        if (chatHistoryElement) {
             // Keep thinking indicator, remove messages
             const messages = chatHistoryElement.querySelectorAll('.chat-message');
             messages.forEach(msg => msg.remove());
        }
        // Reset thinking indicator state
        if (thinkingIndicator) {
            thinkingIndicator.classList.add('hidden');
            thinkingIndicator.style.opacity = '0';
        }
         // Clear attached files UI
         clearAttachedFiles();
         // Reset input text
         messageInput.value = '';
         autoResizeTextarea();
         // Reset placeholder animation state
         if (currentActivePage === 'welcome') {
            startPlaceholderAnimation();
         } else {
             stopPlaceholderAnimation();
             messageInput.placeholder = "Ask me anything..."; // Default placeholder in chat
         }
    }

    function deleteAllHistories() {
        if (confirm("Are you sure you want to delete all chat histories? This cannot be undone.")) {
            chatHistories = [];
            saveChatHistories();
            clearChatDisplay();
            currentChatId = null;
            localStorage.removeItem('novaai_last_active_chat_id'); // Clear last active
            renderChatHistoryList();
            showPage('welcome');

        }
    }

    // Event listeners for chat history features
     if (newChatButton) {
         newChatButton.addEventListener('click', startNewChat);
     }
     // Event listener for new chat icon in header
     if (newChatHeaderIcon) {
         newChatHeaderIcon.addEventListener('click', startNewChat);
     }

     if (deleteHistoryIcon) {
         deleteHistoryIcon.addEventListener('click', deleteAllHistories);
     }
     // Event listener for Home icon (redirect to login.html)
     if(homeIcon) {
         homeIcon.addEventListener('click', () => {
             // Optional: Save current chat before leaving
             // saveCurrentChat(); // Consider how to save unsaved current messages if any
             window.location.href = 'login.html';
         });
     }


    // Render chat history list on DOMContentLoaded
     renderChatHistoryList();

    // === AKHIR: LOGIKA HISTORI CHAT ===


    function checkScrollable() {
        setTimeout(() => {
            if (!chatHistoryElement) return;
            const isScrollable = chatHistoryElement.scrollHeight > chatHistoryElement.clientHeight;
            // Check if near the bottom (within 10px buffer)
            const isAtBottom = chatHistoryElement.scrollHeight - chatHistoryElement.scrollTop <= chatHistoryElement.clientHeight + 10;
            if (isScrollable && !isAtBottom) {
                chatHistoryElement.classList.add('has-scroll-fade');
            } else {
                chatHistoryElement.classList.remove('has-scroll-fade');
            }
        }, 50); // Reduced delay
    }
    if (chatHistoryElement) {
      chatHistoryElement.addEventListener('scroll', checkScrollable);
    }

    function showPage(pageName, initialMessage = null) {
        const currentPageElement = document.getElementById(currentActivePage + 'Section');
        const nextPageElement = document.getElementById(pageName + 'Section');

         // If trying to go to welcome, but chat history is not empty, stay in chat
         if (pageName === 'welcome' && chatHistoryElement && chatHistoryElement.children.length > (thinkingIndicator ? 1 : 0)) {
              // If thinking indicator is present, count only actual messages (elements without 'ai-message' or 'user-message' like the indicator)
              // A better check: count chat-message elements
              const messageCount = chatHistoryElement.querySelectorAll('.chat-message').length;
              if (messageCount > 0) {
                 console.log("Chat history not empty, staying in chat.");
                 return; // Prevent returning to welcome if chat has messages
              }
         }


        if (currentPageElement && currentPageElement.classList.contains('active')) {
            currentPageElement.classList.remove('active');
            setTimeout(() => { currentPageElement.classList.add('hidden'); }, 500); // Wait for animation
        } else if (currentPageElement) {
             currentPageElement.classList.add('hidden'); // Ensure it's hidden if not active initially
        }


        if (nextPageElement) {
             nextPageElement.classList.remove('hidden');
             // Small delay before adding active class to trigger transition
            requestAnimationFrame(() => {
                setTimeout(() => { nextPageElement.classList.add('active'); }, 10);
            });
        }
        currentActivePage = pageName;

        if (pageName === 'chat') {
            // landingThemeToggleContainer.classList.add('hidden'); // Keep theme toggle in header for consistency
            menuIcon.classList.add('hidden');
            backIcon.classList.remove('hidden');
             homeIcon.classList.add('hidden'); // Hide home icon in chat mode

            quickCompleteContainer.classList.remove('active'); // Hide quick suggestions in chat page
             stopPlaceholderAnimation(); // Stop placeholder animation in chat page
             messageInput.placeholder = "Ask me anything..."; // Default placeholder in chat


            // Scroll to bottom and check scrollable after transition
            setTimeout(() => {
                if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
                checkScrollable();
            }, 550); // Delay after page transition


        } else { // pageName === 'welcome'
            // landingThemeToggleContainer.classList.remove('hidden'); // Keep theme toggle
            menuIcon.classList.remove('hidden');
            backIcon.classList.add('hidden');
             homeIcon.classList.remove('hidden'); // Show home icon in welcome mode

             // Show quick suggestions and start placeholder animation in welcome page if input is empty
             if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                 quickCompleteContainer.classList.add('active');
                 startPlaceholderAnimation();
             }
        }
         // Update padding-bottom main content after page switch
         updateInputAreaAppearance();


        if (pageName === 'chat' && initialMessage) {
            // Add user message to display immediately
             addChatMessage(initialMessage, 'user');
             // Add user message to history before sending to API
             addMessageToCurrentChatHistory('user', initialMessage); // Add to history object
            // Then generate AI response
            generateRealAIResponse(initialMessage, attachedFiles);
        }

    }

    // Placeholder logic
    const placeholders_en = ["Ask me anything...","What's on your mind?","Tell me a story...","How can I help you today?","Start a conversation...","I'm ready to chat!","Let's explore together...","What do you want to learn?"];
    let currentPlaceholderIndex = 0;
    let placeholderInterval;

     function updatePlaceholder() {
         if (messageInput.value.trim() !== '' || attachedFiles.length > 0 || currentActivePage !== 'welcome') return; // Only animate in welcome when input/files are empty

         messageInput.style.opacity = '0';
         messageInput.style.transform = 'translateY(-10px)';

         setTimeout(() => {
             currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders_en.length;
             messageInput.placeholder = placeholders_en[currentPlaceholderIndex];
             messageInput.style.opacity = '1';
             messageInput.style.transform = 'translateY(0)';
         }, 500);
     }

    function startPlaceholderAnimation() {
        if (placeholderInterval) {
            clearInterval(placeholderInterval);
        }
         // Start only if in welcome, input empty, and no files
         if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
             updatePlaceholder(); // Initial call
             placeholderInterval = setInterval(updatePlaceholder, 3000);
         }
    }

    function stopPlaceholderAnimation() {
        if (placeholderInterval) {
            clearInterval(placeholderInterval);
            placeholderInterval = null; // Reset interval ID
        }
         // Keep default placeholder when stopped
         messageInput.placeholder = "Ask me anything...";
    }


    messageInput.addEventListener('focus', () => {
        stopPlaceholderAnimation();
        quickCompleteContainer.classList.remove('active');
    });

    messageInput.addEventListener('blur', () => {
         // Restart animation and show quick suggestions if conditions are met after blur
         if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
             startPlaceholderAnimation();
             quickCompleteContainer.classList.add('active');
         } else {
             // Ensure placeholder is reset to default if not animating
             messageInput.placeholder = "Ask me anything...";
         }
    });

    messageInput.addEventListener('input', () => {
        // Hide quick suggestions and stop animation if there's text or files
        if (messageInput.value.trim() !== '' || attachedFiles.length > 0) {
            quickCompleteContainer.classList.remove('active');
            stopPlaceholderAnimation();
        } else {
            // If input is empty and no files, and in welcome page, show quick suggestions and start animation
             if (currentActivePage === 'welcome') {
                quickCompleteContainer.classList.add('active');
                startPlaceholderAnimation();
             } else {
                 // If in chat page and input becomes empty, ensure quick suggestions/animation are off
                 quickCompleteContainer.classList.remove('active');
                 stopPlaceholderAnimation();
             }
        }
        autoResizeTextarea();
    });

    // Initial call to set up placeholder and quick suggestions state
     if (currentActivePage === 'welcome') {
         startPlaceholderAnimation();
          if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
             quickCompleteContainer.classList.add('active');
         }
     }


    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        let scrollHeight = messageInput.scrollHeight;
        const maxHeight = 120; // Max height for textarea
        messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        updateInputAreaAppearance(); // Recalculate main padding based on new input height
    }
    messageInput.addEventListener('input', autoResizeTextarea);
    // Initial resize call
    autoResizeTextarea();

    function addChatMessage(content, sender = 'user') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            // For user messages, just set text content to avoid rendering user-provided HTML/markdown
            messageElement.textContent = content;
        } else {
            // AI message structure (header + content)
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');

            const aiLogoImg = document.createElement('img');
            aiLogoImg.src = 'logo.png'; // Ensure you have a logo.png
            aiLogoImg.alt = 'Novaria Logo';
            aiLogoImg.classList.add('ai-logo');
            aiHeader.appendChild(aiLogoImg);

            const aiNameSpan = document.createElement('span');
            aiNameSpan.classList.add('ai-name');
            aiNameSpan.textContent = 'Novaria'; // App name
            aiHeader.appendChild(aiNameSpan);

            const aiModelTagSpan = document.createElement('span');
            aiModelTagSpan.classList.add('ai-model-tag');
            aiModelTagSpan.textContent = "nova-3.5-quantify"; // Example model tag
            aiHeader.appendChild(aiModelTagSpan);

            messageElement.appendChild(aiHeader);

            const aiContentContainer = document.createElement('div');
            aiContentContainer.classList.add('ai-message-content');
            // Assuming 'content' for AI messages is already HTML (e.g., from Markdown rendering)
            aiContentContainer.innerHTML = content;
            messageElement.appendChild(aiContentContainer);
        }

        if (chatHistoryElement && thinkingIndicator) {
            chatHistoryElement.insertBefore(messageElement, thinkingIndicator);
        } else if (chatHistoryElement) {
            chatHistoryElement.appendChild(messageElement);
        }

        // Animate message in
        requestAnimationFrame(() => {
            setTimeout(() => {
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 10);
        });


        // Scroll to bottom and check scrollable after message is added
        setTimeout(() => {
            if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
            checkScrollable();
        }, 50); // Small delay


        return messageElement; // Return the created element
    }

    function addAiMessageActions(aiMessageElement) {
        const contentContainer = aiMessageElement.querySelector('.ai-message-content');
        if (!contentContainer || contentContainer.querySelector('.ai-message-actions')) return;

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

         // Helper function to get readable text content (excluding code blocks)
        const getResponseText = (contentEl) => {
            let text = '';
            contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                     // Only include text from span or p tags, skip code blocks
                    if (node.tagName === 'SPAN' || node.tagName === 'P') {
                        text += node.textContent + '\n'; // Add newline for paragraphs/spans
                    }
                }
            });
            return text.trim();
        };

         // Helper function to get full content including formatted code blocks for copy/share
        const getFullContent = (contentEl) => {
            let fullContent = '';
             contentEl.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    fullContent += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SPAN' || node.tagName === 'P') {
                        fullContent += node.textContent;
                    } else if (node.classList.contains('code-block')) {
                        const langTag = node.querySelector('.language-tag');
                        const lang = langTag ? langTag.textContent.toLowerCase() : ''; // Use empty string if no language tag
                        const code = node.querySelector('pre').textContent;
                        fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``;
                    }
                }
            });
            // Remove leading/trailing newlines that might result from formatting
            return fullContent.trim();
        };


        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, _messageEl) => { const textToSpeak = getResponseText(contentContainer); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = 'en-US'; /* Default language */ const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; utterance.onerror = (event) => { console.error('Speech synthesis error:', event); buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, msgEl) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait';
                 // Find the last user message preceding this AI message
                 let previousSibling = msgEl.previousElementSibling;
                 let lastUserMessage = null;
                 while(previousSibling) {
                     if (previousSibling.classList.contains('user-message')) {
                         lastUserMessage = previousSibling;
                         break;
                     }
                     previousSibling = previousSibling.previousElementSibling;
                 }

                 if (lastUserMessage) {
                     // Remove the current AI message element from display
                     msgEl.remove();
                     // Remove the corresponding AI message from the chat history object
                     const activeHistory = chatHistories.find(h => h.id === currentChatId);
                     if (activeHistory) {
                          // Find the index of the AI message that was just removed
                          // This is a bit tricky; we'll remove the last message in the history for simplicity,
                          // assuming the regeneration is always for the very last AI message.
                          // A more robust solution might add unique IDs to messages.
                          const lastMessageInHistory = activeHistory.messages[activeHistory.messages.length - 1];
                          if (lastMessageInHistory && lastMessageInHistory.sender === 'ai') {
                              activeHistory.messages.pop(); // Remove the last AI message
                              saveChatHistories(); // Save history after removing AI message
                          } else {
                               console.warn("Last message in history was not an AI message, cannot remove for regeneration.");
                          }
                     }

                     // Generate a new response based on the last user message *and* preceding history
                     // The generateRealAIResponse function will now fetch the history itself.
                     generateRealAIResponse(lastUserMessage.textContent, attachedFiles); // Pass the original user message and attached files

                 } else {
                     console.warn("Could not find a preceding user message to regenerate from.");
                     svg.classList.remove('rotating');
                     buttonEl.disabled = false;
                     buttonEl.style.cursor = 'pointer';
                     // Optionally display an error message to the user
                     addChatMessage("<span>Could not regenerate. The previous user message was not found.</span>", 'ai');
                 }
            } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, _messageEl) => { const fullContent = getFullContent(contentContainer); if (navigator.share) { navigator.share({ title: 'Novaria Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];
        buttons.forEach((btnInfo) => {
            const button = document.createElement('button');
            button.classList.add('ai-action-btn');
            button.title = btnInfo.title;
            button.innerHTML = btnInfo.icon;
            button.addEventListener('click', (e) => {
                // Stop propagation so ripple on parent chat-message doesn't fire
                 e.stopPropagation();
                 btnInfo.action(button, aiMessageElement);
            });
            actionsContainer.appendChild(button);
        });
        contentContainer.appendChild(actionsContainer);
         // Ensure scroll to bottom after actions are added
        setTimeout(() => { if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight; checkScrollable(); }, 50);
    }


    async function generateRealAIResponse(userMessage, files = []) {
        // Show thinking indicator
        if (thinkingIndicator) {
            thinkingIndicator.classList.remove('hidden');
            thinkingIndicator.style.opacity = '1';
        }
         // Ensure scroll to bottom while thinking
        setTimeout(() => {
            if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
            checkScrollable();
        }, 50);


        try {
            const modelToUseInAPI = "gemini"; // Can be dynamic if needed

            // --- START: GATHER HISTORY FOR CONTEXT ---
            const activeHistory = chatHistories.find(h => h.id === currentChatId);
            let messagesForApi = [];

            if (activeHistory && activeHistory.messages.length > 0) {
                // Select the last N messages from history
                // Slice starts from max(0, length - N) to get the last N elements
                const recentHistory = activeHistory.messages.slice(Math.max(0, activeHistory.messages.length - MAX_MESSAGES_FOR_CONTEXT));

                // Map history messages to the format expected by typical chat completion APIs (role: user/assistant)
                messagesForApi = recentHistory.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant', // Map 'ai' sender to 'assistant' role
                    // Note: If your API supports file inputs within messages,
                    // you might need to structure content differently here based on msg type.
                    // For text-only history context, just use the content.
                    content: msg.content // Assuming stored content is suitable for sending back as context
                                          // If content includes HTML from markdown rendering, you might need
                                          // to strip HTML tags or send the raw text version if available.
                                          // Simple strip: msg.content.replace(/<[^>]*>?/gm, '').replace(/\n+/g, '\n').trim();
                }));
            }

            // Add the *current* user message as the *last* message in the context array
            messagesForApi.push({ role: 'user', content: userMessage });
            // --- END: GATHER HISTORY FOR CONTEXT ---


            const payload = {
                // Send the array of messages (history + current user message)
                messages: messagesForApi,
                model: modelToUseInAPI // Send model to API
            };

            // Add file details if any are attached *to the current message*
            // IMPORTANT: If your API supports multimodal history, file details might need
            // to be integrated into the `messagesForApi` array for past messages as well.
            if (files && files.length > 0) {
                payload.fileDetails = files.map(f => ({ name: f.name, type: f.type, size: f.size }));
                // As noted before, sending actual file *content* requires reading files client-side
                // and including the data (e.g., base64) in the payload, and your backend
                // must be set up to handle this multi-part/multimodal input.
            }

            console.log("Sending payload to API:", payload); // Log the payload being sent

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
            const rawAiResponseText = data.text; // Assuming API returns text

            // Hide thinking indicator
            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            // Delay adding message slightly to smooth transition
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');

                // Personalize greeting (optional)
                let personalizedResponseText = rawAiResponseText;
                if (currentUser && currentUser.name) {
                    const greeting = `Hii ${currentUser.givenName || currentUser.name.split(' ')[0]},\n\n`;
                    personalizedResponseText = greeting + rawAiResponseText;
                }

                // Simple Markdown-like rendering for bold/italic/code blocks
                // This is a basic client-side renderer. For full Markdown, use a library.
                let finalHtmlContent = '';
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let lastIndex = 0;

                personalizedResponseText.replace(codeBlockRegex, (match, language, code, offset) => {
                    // Text before code block
                    const plainText = personalizedResponseText.substring(lastIndex, offset);
                    // Simple text sanitization (basic HTML entities)
                    const sanitizedText = plainText.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                     // Replace newlines with <br> for text outside code blocks
                    finalHtmlContent += `<span>${sanitizedText.replace(/\n/g, '<br>')}</span>`;


                    // Code block HTML structure
                    const lang = language || 'text';
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

                // Text after the last code block
                const remainingText = personalizedResponseText.substring(lastIndex);
                if (remainingText) {
                    const sanitizedRemainingText = remainingText.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                     // Replace newlines with <br> for remaining text
                    finalHtmlContent += `<span>${sanitizedRemainingText.replace(/\n/g, '<br>')}</span>`;
                }

                // If no code blocks were found, just add the whole text with <br> for newlines
                 if (lastIndex === 0 && !codeBlockRegex.test(personalizedResponseText)) {
                     const sanitizedText = personalizedResponseText.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                     finalHtmlContent = `<span>${sanitizedText.replace(/\n/g, '<br>')}</span>`;
                 }


                const aiMessageElement = addChatMessage(finalHtmlContent, 'ai');
                addAiMessageActions(aiMessageElement); // Add action buttons

                // Add AI response to current chat history object
                 addMessageToCurrentChatHistory('ai', finalHtmlContent);


                clearAttachedFiles(); // Clear files after response
                checkScrollable(); // Check scrollable state after adding message
            }, 300);

        } catch (error) {
            console.error('Error fetching from /api/generate:', error);
            // Hide thinking indicator even on error
            if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
                const errorMessage = `<span>Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.</span>`;
                addChatMessage(errorMessage, 'ai');
                // Optionally add the error message to history as an AI message
                 addMessageToCurrentChatHistory('ai', errorMessage);
            }, 300);
        }
    }


    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        // Send if there's text or files
        if (message !== '' || attachedFiles.length > 0) {
            let finalPrompt = message;
             // Construct prompt string including file info if any
             if (attachedFiles.length > 0 && message === '') {
                 const fileNames = attachedFiles.map(f => f.name).join(', ');
                 finalPrompt = `Harap menganalisis file-file ini: ${fileNames}`;
             } else if (attachedFiles.length > 0) {
                 const fileNames = attachedFiles.map(f => f.name).join(', ');
                 finalPrompt = `${message} (Dilampirkan: ${fileNames})`;
             }

            // If on welcome page, switch to chat and start a new session
            if (currentActivePage === 'welcome') {
                // showPage will add the user message and call generateResponse
                showPage('chat', finalPrompt);
            } else {
                // If already on chat page, just add message and generate response
                addChatMessage(finalPrompt, 'user');
                 addMessageToCurrentChatHistory('user', finalPrompt); // Add to history object
                generateRealAIResponse(finalPrompt, attachedFiles);
            }

            // Clear input and files after sending
            messageInput.value = '';
            autoResizeTextarea();
            clearAttachedFiles(); // Clears UI and array

            // Hide quick suggestions and stop animation
            quickCompleteContainer.classList.remove('active');
            stopPlaceholderAnimation();
        }
    });
    // Send message on Enter (without Shift+Enter)
    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

    // Event listener for sidebar
    menuIcon.addEventListener('click', () => {
         sidebar.classList.add('active');
         sidebarOverlay.classList.add('active');
         renderChatHistoryList(); // Render history when sidebar opens
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
    // Event listener for Back icon (back to welcome, clear current chat)
    backIcon.addEventListener('click', () => {
        // Start a new chat session, which clears display and goes to welcome
        startNewChat();
    });


    // Theme toggle logic
    const savedTheme = localStorage.getItem('novaai_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light-mode') {
        applyTheme(true);
    } else if (savedTheme === 'dark-mode') {
         applyTheme(false);
    } else {
         // Default to system preference if no theme is saved
         applyTheme(!prefersDark); // applyTheme(true) for light, applyTheme(false) for dark
    }


    function applyTheme(isLightMode) {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('novaai_theme', 'light-mode');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('novaai_theme', 'dark-mode');
        }
        // Update the state of the theme toggle checkbox
        if (themeToggleLanding) {
             themeToggleLanding.checked = isLightMode;
        }
     }

    if (themeToggleLanding) {
         themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));
    }


    // Ripple Effects Setup
    function setupRippleEffects() {
        const clickableElements = document.querySelectorAll('.btn-circle, header svg, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn, .remove-chip-btn, .new-chat-button');
        clickableElements.forEach(element => {
            // Remove any previously added handler to prevent duplicates
            const oldHandler = element._rippleHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }

            const newHandler = function (e) {
                // Don't trigger ripple if clicking delete history icon
                 if (e.target.closest('.delete-history-icon')) {
                     return;
                 }
                 // Don't trigger ripple on file input element itself
                 if (e.target === fileInput) {
                     return;
                 }
                 // Don't trigger ripple if inside the file input area but not the plus button
                 if (this === inputWrapper && e.target !== plusButton && !plusButton.contains(e.target)) {
                      return;
                 }

                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('select')) {
                    return;
                }
                 // Prevent ripple on the file chip container itself, only on remove button if needed
                 if (this === fileChipContainer && !e.target.closest('.remove-chip-btn')) {
                     return;
                 }


                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                this.appendChild(ripple); // Append to the clicked element

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
             // Store the handler so it can be removed later if needed (e.g., on element removal/recreation)
            element._rippleHandler = newHandler;
        });
    }
    setupRippleEffects();
    // Use MutationObserver to re-setup ripples when new clickable elements are added to DOM
    const observer = new MutationObserver((mutations) => {
         let needsRippleSetup = false;
         mutations.forEach((mutation) => {
             if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                 mutation.addedNodes.forEach(node => {
                     if (node.nodeType === 1) { // Check if it's an element node
                          // Check the added node itself or its descendants for clickable elements
                         if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn') || node.matches('.remove-chip-btn') || node.matches('.history-item') || node.matches('.new-chat-button'))) {
                              needsRippleSetup = true;
                         } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn') || node.querySelector('.remove-chip-btn') || node.querySelector('.history-item') || node.querySelector('.new-chat-button'))) {
                             needsRippleSetup = true;
                         }
                     }
                 });
             }
         });
         if (needsRippleSetup) {
             // Use a small timeout to ensure elements are fully rendered before attaching listeners
             setTimeout(setupRippleEffects, 50);
         }
    });
    // Observe relevant containers where dynamic elements might be added
    if (chatHistoryElement) observer.observe(chatHistoryElement, { childList: true, subtree: true });
    if (fileChipContainer) observer.observe(fileChipContainer, { childList: true, subtree: true });
    if (sidebarChatHistoryElement) observer.observe(sidebarChatHistoryElement, { childList: true, subtree: true });


    function updateInputAreaAppearance() {
        // Recalculate the padding-bottom for the main content
        const inputWrapperHeight = inputWrapper.offsetHeight;
        const bottomMargin = 15; // Matches CSS bottom margin
        const extraPadding = 20; // Extra space below input wrapper
        const totalBottomSpace = inputWrapperHeight + bottomMargin + extraPadding;

        mainContent.style.paddingBottom = `${totalBottomSpace}px`;

        // Recalculate chatHistory height (if using fixed height)
        // Or ensure chatHistory is set to flex-grow: 1 in CSS and relies on flex layout
        // If using fixed height calculation:
         if (chatHistoryElement) {
             const headerHeight = document.querySelector('header').offsetHeight;
             const mainPaddingTop = parseInt(window.getComputedStyle(mainContent).paddingTop, 10);
             // Height is total viewport height minus header, main padding top, and the total space taken by input area below main
             chatHistoryElement.style.height = `calc(100vh - ${headerHeight + mainPaddingTop}px - ${totalBottomSpace}px)`;
         }


        // Ensure scroll to bottom after layout update
        setTimeout(() => {
            if (chatHistoryElement) chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
            checkScrollable();
        }, 50);
    }
     // Call updateInputAreaAppearance initially and on window resize
     window.addEventListener('resize', updateInputAreaAppearance);
     // Call after DOM loaded
     updateInputAreaAppearance();


    // File attachment logic
    plusButton.addEventListener('click', () => { fileInput.click(); });

    function displayFileChipItem(file) {
        const chipItem = document.createElement('div');
        chipItem.classList.add('file-chip-item');
        chipItem.dataset.fileName = file.name;
        chipItem.dataset.fileSize = file.size;

        const fileIconContainer = document.createElement('span');
        fileIconContainer.classList.add('file-icon');
        // SVGs for file types (add more if needed)
        const imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/></svg>`;
        const fileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;

        fileIconContainer.innerHTML = file.type.startsWith('image/') ? imageSvg : fileSvg;
        chipItem.appendChild(fileIconContainer);

        const fileDetails = document.createElement('div');
        fileDetails.classList.add('file-details');

        const fileNamePreview = document.createElement('span');
        fileNamePreview.classList.add('file-name-preview');
        const maxNameDisplayLength = window.innerWidth <= 768 ? 8 : 10; // Shorter name on mobile
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const fileExt = file.name.lastIndexOf('.') > 0 ? file.name.substring(file.name.lastIndexOf('.')) : '';
        fileNamePreview.textContent = fileNameWithoutExt.length > maxNameDisplayLength ?
                                    fileNameWithoutExt.substring(0, maxNameDisplayLength) + "..." + fileExt :
                                    file.name;
        fileNamePreview.title = file.name; // Full name on hover
        fileDetails.appendChild(fileNamePreview);

        const fileSizePreview = document.createElement('span');
        fileSizePreview.classList.add('file-size-preview');
        fileSizePreview.textContent = formatFileSize(file.size);
        fileDetails.appendChild(fileSizePreview);
        chipItem.appendChild(fileDetails);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-chip-btn');
        removeButton.innerHTML = '×'; // Simple 'x' character
        removeButton.title = `Remove ${file.name}`;
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent ripple on parent chip
            removeAttachedFile(file.name, file.size);
        });
        chipItem.appendChild(removeButton);

        fileChipContainer.appendChild(chipItem);
        // Animate chip in
        requestAnimationFrame(() => {
            setTimeout(() => chipItem.classList.add('visible'), 10);
        });


        if (fileChipContainer.children.length > 0) {
            fileChipContainer.style.display = 'flex'; // Show container if it has chips
        }
        // Scroll chip container to the right to show the newest chip
        fileChipContainer.scrollLeft = fileChipContainer.scrollWidth;

        autoResizeTextarea(); // Adjust textarea/input wrapper height
        updateInputAreaAppearance(); // Update main padding

        // Hide quick suggestions and stop placeholder animation when files are added
         quickCompleteContainer.classList.remove('active');
         stopPlaceholderAnimation();

    }

    function removeAttachedFile(fileName, fileSize) {
        // Filter out the file based on name and size (simple check, might need more robust ID)
        attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSize));

        // Find and remove the chip element from the DOM
        const fileItemToRemove = fileChipContainer.querySelector(
            `.file-chip-item[data-file-name="${CSS.escape(fileName)}"][data-file-size="${fileSize}"]`
        );
        if (fileItemToRemove) {
            fileItemToRemove.classList.remove('visible'); // Start fade out animation
            setTimeout(() => {
                fileItemToRemove.remove(); // Remove from DOM after animation

                // Hide the container if no chips are left
                if (fileChipContainer.children.length === 0) {
                    fileChipContainer.style.display = 'none';
                }

                autoResizeTextarea(); // Re-adjust textarea height
                updateInputAreaAppearance(); // Re-calculate main padding

                // Show quick suggestions and start placeholder animation if no files and no text, and in welcome page
                 if (attachedFiles.length === 0 && messageInput.value.trim() === '' && currentActivePage === 'welcome') {
                     quickCompleteContainer.classList.add('active');
                     startPlaceholderAnimation();
                 }

            }, 300); // Match CSS transition duration
        }
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        fileChipContainer.innerHTML = ''; // Remove all chip elements
        fileChipContainer.style.display = 'none'; // Hide the container
        autoResizeTextarea(); // Re-adjust textarea height
        updateInputAreaAppearance(); // Re-calculate main padding
        // Show quick suggestions and start placeholder animation if no files and no text, and in welcome page
         if (messageInput.value.trim() === '' && currentActivePage === 'welcome') {
             quickCompleteContainer.classList.add('active');
             startPlaceholderAnimation();
         }
    }

    fileInput.addEventListener('change', (event) => {
        const filesToProcess = Array.from(event.target.files);
        if (filesToProcess.length === 0) return;

        let canAddCount = MAX_FILES_ALLOWED - attachedFiles.length;

        if (canAddCount <= 0) {
            alert(`You have reached the maximum of ${MAX_FILES_ALLOWED} files.`);
            fileInput.value = ''; // Clear input value
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
            // Simple duplicate check by name and size
            const isDuplicate = attachedFiles.some(f => f.name === file.name && f.size === file.size);
            if (isDuplicate) {
                alert(`File "${file.name}" is already attached.`);
                continue;
            }
            newValidFiles.push(file);
        }

        // Add valid new files to the attachedFiles array and display them
        newValidFiles.forEach(file => {
            attachedFiles.push(file);
            displayFileChipItem(file);
        });

        fileInput.value = ''; // Clear the input value after processing files

        // Hide quick suggestions and stop placeholder animation when files are added
         quickCompleteContainer.classList.remove('active');
         stopPlaceholderAnimation();

    });

    // Voice input logic
    // Check for browser support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Default language
        recognition.continuous = false; // Process a single utterance
        recognition.interimResults = true; // Get results while speaking

        let finalTranscript = ''; // Stores the final, confirmed transcript

        recognition.onstart = () => {
            voiceInputButton.style.backgroundColor = 'red'; // Indicate recording
            messageInput.placeholder = 'Listening...';
            stopPlaceholderAnimation(); // Stop placeholder animation while listening
            quickCompleteContainer.classList.remove('active'); // Hide quick suggestions while listening
            finalTranscript = ''; // Reset transcript on start
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
            // Update textarea with both final and interim transcript
            messageInput.value = finalTranscript + interimTranscript;
            autoResizeTextarea(); // Adjust textarea height as text is added
        };

        recognition.onend = () => {
            voiceInputButton.style.backgroundColor = ''; // Reset button color
            if (finalTranscript.trim() !== '') {
                messageInput.value = finalTranscript.trim(); // Set final text if not empty
            }
            // Restore placeholder and quick suggestions state based on input and page
            if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
                 startPlaceholderAnimation();
                 quickCompleteContainer.classList.add('active');
             } else {
                 messageInput.placeholder = "Ask me anything..."; // Default placeholder
             }
            finalTranscript = ''; // Clear for next session
        };

        recognition.onerror = (event) => {
            voiceInputButton.style.backgroundColor = ''; // Reset button color
            console.error('Speech recognition error: ' + event.error);
            // Restore placeholder and quick suggestions state based on input and page
            if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
                startPlaceholderAnimation();
                quickCompleteContainer.classList.add('active');
            } else {
                 messageInput.placeholder = "Ask me anything..."; // Default placeholder
            }
             finalTranscript = ''; // Clear on error
            // Optional: Display a user-friendly error message
            // alert('Could not start speech recognition. Please check your microphone permissions.');
        };

        voiceInputButton.addEventListener('click', () => {
            try {
                 // Check if recognition is already active (though continuous=false makes this less likely)
                 // A simple state check might be needed if allowing stopping mid-speech
                recognition.start();
            } catch (e) {
                console.error("Error starting speech recognition:", e);
                // If start fails, try stopping just in case it's in a weird state
                try {
                   if (recognition && typeof recognition.stop === 'function') recognition.stop();
                } catch(stopErr) {
                   console.error("Error stopping recognition after failed start:", stopErr);
                }
                 // Restore state if failed to start
                 voiceInputButton.style.backgroundColor = '';
                 if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
                     startPlaceholderAnimation();
                     quickCompleteContainer.classList.add('active');
                 } else {
                      messageInput.placeholder = "Ask me anything...";
                 }
                 finalTranscript = '';
                 alert('Could not start speech recognition. Make sure your browser supports it and you have granted microphone permissions.');
            }
        });
    } else {
        // Hide the voice button if not supported
        voiceInputButton.style.display = 'none';
        console.warn('Speech Recognition not supported in this browser.');
    }


    // Initial page load: Check if there's a last active chat history to load
    if (isLoggedIn === 'true') {
        const lastActiveChatId = localStorage.getItem('novaai_last_active_chat_id');
        if (lastActiveChatId) {
             loadChatHistory(parseInt(lastActiveChatId, 10)); // Load the last active chat
        } else {
             showPage('welcome'); // If no last active chat, show welcome page
        }
    }


    // --- Helper Functions ---

    // Global function for code copy button (needs to be in global scope or attached to window)
    window.copyCode = function(buttonElement) {
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
    };

    // Helper to format file size
    function formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

     // Helper to read file as Base64 (Conceptual - needed if sending file *content*)
     // async function readFileAsBase64(file) {
     //     return new Promise((resolve, reject) => {
     //         const reader = new FileReader();
     //         reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get base64 string
     //         reader.onerror = reject;
     //         reader.readAsDataURL(file);
     //     });
     // }

});