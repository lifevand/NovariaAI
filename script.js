// === GANTI SELURUH ISI SCRIPT.JS ANDA DENGAN KODE INI (VERSI PERBAIKAN TRANSLATIONS) ===

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
    // const infoModalContent = document.getElementById('infoModalContent'); // Tidak terpakai langsung, isinya diakses via modalBody dan modalTitleElement
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalTitleElement = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    const plusButton = document.getElementById('plusButton');
    const fileInput = document.getElementById('fileInput');
    
    const pendingFilesPreviewContainer = document.getElementById('pendingFilesPreviewContainer');
    const inputWrapper = document.querySelector('.input-wrapper');
    
    const MAX_FILES = 5;
    const MAX_FILE_SIZE_KB = 560;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;
    let attachedFiles = []; 

    const voiceInputButton = document.getElementById('voiceInputButton');
    let recognition;

    const SVG_ICON_IMAGE = `<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.06 9.83a2.75 2.75 0 0 1 1.737 0c.368.123.672.338.967.596c.282.248.602.579.985.975q.686.713 1.374 1.424c.448.462.628.95.626 1.602c-.006 1.659-.041 2.797-.517 3.73a4.75 4.75 0 0 1-2.076 2.075c-1.345.686-3.065.518-4.523.518h-3.266c-1.092 0-1.958 0-2.655-.057c-.714-.058-1.317-.18-1.868-.46a4.75 4.75 0 0 1-2.076-2.076c-.295-.579-.41-1.209-.47-1.976c-.088-1.16.896-2.099 1.653-2.862c.307-.31.631-.57 1.033-.718a2.75 2.75 0 0 1 1.889 0c.402.148.726.408 1.033.718c.298.3.632.7 1.036 1.185c.035.043.09.083.141.03l3.025-3.133c.384-.396.703-.727.985-.975c.295-.258.6-.473.967-.596m.023 1.723c-.23.202-.507.488-.917.913l-3.004 3.11a1.58 1.58 0 0 1-2.351-.086c-.431-.516-.724-.867-.97-1.114c-.24-.243-.38-.328-.483-.366a1.25 1.25 0 0 0-.859 0c-.103.038-.242.123-.483.366c-.37.372-.697.787-1.032 1.19c-.161.193-.205.295-.187.54c.05.656.147 1.055.307 1.37a3.25 3.25 0 0 0 1.42 1.42c.305.155.69.251 1.31.302c.63.051 1.434.052 2.566.052h3.2c1.192 0 2.765.212 3.876-.354a3.25 3.25 0 0 0 1.42 1.42c.282-.555.346-1.303.353-3.054c.001-.274-.041-.386-.238-.589l-1.32-1.367c-.41-.425-.686-.71-.917-.913c-.515-.452-1.154-.472-1.691 0"/><path fill="currentColor" d="M10.367 3.25h3.266c1.092 0 1.958 0 2.655.057c.714.058 1.317.18 1.869.46a4.75 4.75 0 0 1 2.075 2.077c.281.55.403 1.154.461 1.868c.057.697.057 1.563.057 2.655v3.266c0 1.092 0 1.958-.057 2.655c-.058.714-.18 1.317-.46 1.869a4.75 4.75 0 0 1-2.077 2.075c-.55.281-1.154.403-1.868.461c-.697.057-1.563.057-2.655.057h-3.266c-1.092 0-1.958 0-2.655-.057c-.714-.058-1.317-.18-1.868-.46a4.75 4.75 0 0 1-2.076-2.076c-.281-.552-.403-1.155-.461-1.869c-.057-.697-.057-1.563-.057-2.655v-3.266c0-1.092 0-1.958.057-2.655c.058-.714.18-1.317.46-1.868a4.75 4.75 0 0 1 2.077-2.076c.55-.281 1.154-.403 1.868-.461c.697-.057 1.563.057 2.655-.057M7.834 4.802c-.62.05-1.005.147-1.31.302a3.25 3.25 0 0 0-1.42 1.42c-.155.305-.251.69-.302 1.31c-.051.63-.052 1.434-.052 2.566v3.2c0 1.133 0 1.937.052 2.566c.05.62.147 1.005.302 1.31a3.25 3.25 0 0 0 1.42 1.42c.305.155.69.251 1.31.302c.63.051 1.434.052 2.566.052h3.2c1.133 0 1.937 0 2.566-.052c.62-.05 1.005-.147 1.31-.302a3.25 3.25 0 0 0 1.42-1.42c.155-.305.251-.69.302-1.31c.051-.63.052-1.434.052-2.566v-3.2c0-1.132 0-1.937-.052-2.566c-.05-.62-.147-1.005-.302-1.31a3.25 3.25 0 0 0-1.42-1.42c-.305-.155-.69-.251-1.31-.302c-.63-.051-1.434-.052-2.566-.052h-3.2c-1.132 0-1.937 0-2.566.052"/><path fill="currentColor" d="M10 7.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5M7.25 9a2.75 2.75 0 1 1 5.5 0a2.75 2.75 0 0 1-5.5 0"/></svg>`;
    const SVG_ICON_FILE = `<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z"/></svg>`;

    // --- MULAI OBJEK TRANSLATIONS YANG HILANG ---
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
            privacyPolicyContent: `<h3>Privacy Policy</h3><p>Your privacy is important to us. It is NovaAI's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p><p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p><p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p><p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p><p>Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p><p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p><p>Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p><p>This policy is effective as of June 7, 2025.</p>`,
            termsAndConditionsContent: `<h3>Terms & Conditions</h3><p>Welcome to NovaAI. By accessing or using our services, you agree to be bound by these Terms and Conditions.</p><p>These Terms apply to all visitors, users and others who access or use the Service.</p><p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p><h4>Intellectual Property</h4><p>The Service and its original content, features and functionality are and will remain the exclusive property of NovaAI and its licensors. The Service is protected by copyright, trademark, and other laws of both the Indonesia and foreign countries.</p><p>Our Service may contain links to third-party web sites or services that are not owned or controlled by NovaAI.</p><p>NovaAI has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p><p>We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.</p><p>This document was last updated on June 7, 2025.</p>`,
            policyContent: `<h3>Policy</h3><p>This document outlines the general policies governing the use of NovaAI services.</p><p>1. **Acceptable Use:** Users must not use NovaAI for any unlawful or prohibited activities. This includes, but is not limited to, spamming, transmitting harmful code, or infringing on intellectual property rights.</p><p>2. **Content:** Users are solely responsible for the content they submit through NovaAI. NovaAI does not endorse or assume responsibility for any user-generated content.</p><p>3. **Service Availability:** While we strive for 24/7 availability, NovaAI may be temporarily unavailable due to maintenance, upgrades, or unforeseen technical issues.</p><p>4. **Modifications to Service:** NovaAI reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.</p><p>For more detailed information, please refer to our Terms & Conditions and Privacy Policy.</p><p>Last modified: June 7, 2025.</p>`,
            aboutUsContent: `<h3>About Us</h3><p>NovaAI is an innovative AI assistant designed to simplify your daily tasks and provide quick, accurate information.</p><p>Our mission is to make advanced AI accessible and user-friendly for everyone. We believe in the power of artificial intelligence to enhance productivity, foster learning, and spark creativity.</p><p>Developed with a focus on privacy and user experience, NovaAI continuously evolves to meet the needs of our users. We are committed to transparency and providing a reliable service.</p><p>Thank you for choosing NovaAI. We're excited to grow and improve with your feedback.</p><p>Founded: 2025</p>`
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
            privacyPolicyContent: `<h3>Kebijakan Privasi</h3><p>Privasi Anda penting bagi kami. Kebijakan NovaAI adalah untuk menghormati privasi Anda terkait informasi apa pun yang mungkin kami kumpulkan dari Anda di seluruh situs web kami, dan situs lain yang kami miliki dan operasikan.</p><p>Kami hanya meminta informasi pribadi jika kami benar-benar membutuhkannya untuk menyediakan layanan kepada Anda. Kami mengumpulkannya dengan cara yang adil dan sah, dengan pengetahuan dan persetujuan Anda. Kami juga memberi tahu Anda mengapa kami mengumpulkannya dan bagaimana itu akan digunakan.</p><p>Kami hanya menyimpan informasi yang dikumpulkan selama diperlukan untuk menyediakan layanan yang Anda minta. Data yang kami simpan, akan kami lindungi dengan cara yang dapat diterima secara komersial untuk mencegah kehilangan dan pencurian, serta akses, pengungkapan, penyalinan, penggunaan atau modifikasi yang tidak sah.</p><p>Kami tidak membagikan informasi identitas pribadi secara publik atau dengan pihak ketiga, kecuali jika diwajibkan oleh hukum.</p><p>Situs web kami dapat menautkan ke situs eksternal yang tidak dioperasikan oleh kami. Perlu diketahui bahwa kami tidak memiliki kendali atas konten dan praktik situs-situs ini, dan tidak dapat menerima tanggung jawab atas kebijakan privasi masing-masing.</p><p>Anda bebas untuk menolak permintaan kami untuk informasi pribadi Anda, dengan pemahaman bahwa kami mungkin tidak dapat menyediakan beberapa layanan yang Anda inginkan.</p><p>Penggunaan Anda yang berkelanjutan atas situs web kami akan dianggap sebagai penerimaan praktik kami seputar privasi dan informasi pribadi. Jika Anda memiliki pertanyaan tentang bagaimana kami menangani data pengguna dan informasi pribadi, jangan ragu untuk menghubungi kami.</p><p>Kebijakan ini berlaku efektif mulai 7 Juni 2025.</p>`,
            termsAndConditionsContent: `<h3>Syarat & Ketentuan</h3><p>Selamat datang di NovaAI. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat dengan Syarat dan Ketentuan ini.</p><p>Ketentuan ini berlaku untuk semua pengunjung, pengguna, dan pihak lain yang mengakses atau menggunakan Layanan.</p><p>Dengan mengakses atau menggunakan Layanan, Anda setuju untuk terikat dengan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan, maka Anda tidak boleh mengakses Layanan.</p><h4>Kekayaan Intelektual</h4><p>Layanan dan konten asli, fitur, dan fungsionalitasnya adalah dan akan tetap menjadi milik eksklusif NovaAI dan pemberi lisensinya. Layanan ini dilindungi oleh hak cipta, merek dagang, dan undang-undang lain baik di Indonesia maupun negara asing.</p><p>Layanan kami mungkin berisi tautan ke situs web atau layanan pihak ketiga yang tidak dimiliki atau dikendalikan oleh NovaAI.</p><p>NovaAI tidak memiliki kendali atas, dan tidak bertanggung jawab atas, konten, kebijakan privasi, atau praktik situs web atau layanan pihak ketiga mana pun.</p><p>Kami sangat menyarankan Anda untuk membaca syarat dan ketentuan serta kebijakan privasi situs web atau layanan pihak ketiga mana pun yang Anda kunjungi.</p><p>Dokumen ini terakhir diperbarui pada 7 Juni 2025.</p>`,
            policyContent: `<h3>Kebijakan</h3><p>Dokumen ini menguraikan kebijakan umum yang mengatur penggunaan layanan NovaAI.</p><p>1. **Penggunaan yang Dapat Diterima:** Pengguna tidak boleh menggunakan NovaAI untuk kegiatan yang melanggar hukum atau dilarang. Ini termasuk, namun tidak terbatas pada, spamming, transmisi kode berbahaya, atau pelanggaran hak kekayaan intelektual.</p><p>2. **Konten:** Pengguna sepenuhnya bertanggung jawab atas konten yang mereka kirimkan melalui NovaAI. NovaAI tidak mendukung atau bertanggung jawab atas konten yang dibuat oleh pengguna.</p><p>3. **Ketersediaan Layanan:** Meskipun kami berusaha untuk ketersediaan 24/7, NovaAI mungkin sementara tidak tersedia karena pemeliharaan, peningkatan, atau masalah teknis yang tidak terduga.</p><p>4. **Modifikasi Layanan:** NovaAI berhak untuk memodifikasi atau menghentikan, sementara atau permanen, Layanan (atau bagian darinya) dengan atau tanpa pemberitahuan.</p><p>Untuk informasi lebih lanjut, silakan lihat Syarat & Ketentuan dan Kebijakan Privasi kami.</p><p>Terakhir dimodifikasi: 7 Juni 2025.</p>`,
            aboutUsContent: `<h3>Tentang Kami</h3><p>NovaAI adalah asisten AI inovatif yang dirancang untuk menyederhanakan tugas harian Anda dan memberikan informasi yang cepat dan akurat.</p><p>Misi kami adalah membuat AI canggih dapat diakses dan mudah digunakan untuk semua orang. Kami percaya pada kekuatan kecerdasan buatan untuk meningkatkan produktivitas, mendorong pembelajaran, dan memicu kreativitas.</p><p>Dikembangkan dengan fokus pada privasi dan pengalaman pengguna, NovaAI terus berkembang untuk memenuhi kebutuhan pengguna kami. Kami berkomitmen pada transparansi dan menyediakan layanan yang andal.</p><p>Terima kasih telah memilih NovaAI. Kami sangat antusias untuk tumbuh dan berkembang dengan masukan Anda.</p><p>Didirikan: 2025</p>`
        }
    };
    // --- AKHIR OBJEK TRANSLATIONS ---


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

    function showPage(pageName, initialMessage = null, initialFiles = null) {
        if (currentActivePage === pageName && !initialMessage && (!initialFiles || initialFiles.length === 0)) return; 
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
                chatHistory.scrollTop = chatHistory.scrollHeight;
                checkScrollable();
            }, 10);
            quickCompleteContainer.classList.remove('active');
            if (initialMessage || (initialFiles && initialFiles.length > 0)) {
                let displayMessage = initialMessage;
                if (!displayMessage && initialFiles && initialFiles.length > 0) {
                     displayMessage = currentLanguage === 'id' ? `Menganalisis ${initialFiles.length} file...` : `Analyzing ${initialFiles.length} file(s)...`;
                }
                addChatMessage(displayMessage, 'user', initialFiles); 
                generateRealAIResponse(initialMessage || displayMessage, initialFiles); // Pass original initialMessage if available
            }
        } else {
            landingThemeToggleContainer.classList.remove('hidden');
            menuIcon.classList.remove('hidden');
            backIcon.classList.add('hidden');
            if (messageInput.value.trim() === '' && attachedFiles.length === 0) {
                quickCompleteContainer.classList.add('active');
            }
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
        if (messageInput.value.trim() !== '' || (recognition && recognition.recording)) return; // Don't animate if listening
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
        if (messageInput.value.trim() === '' && attachedFiles.length === 0 && (!recognition || !recognition.recording)) {
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

        const inputWrapperPadding = 10 * 2;
        let newWrapperHeight = Math.min(scrollHeight, maxHeight) + inputWrapperPadding;
        inputWrapper.style.height = `${Math.min(newWrapperHeight, 160)}px`; // 160 max wrapper height
        updateInputAreaPadding();
    }
    messageInput.addEventListener('input', autoResizeTextarea);
    autoResizeTextarea();

    function truncateFileName(name, maxLength = 20) {
        if (name.length <= maxLength) return name;
        try {
            const extIndex = name.lastIndexOf('.');
            if (extIndex === -1 || extIndex < name.length - 6) { // if no extension or very short ext
                 return name.substring(0, maxLength - 3) + "...";
            }
            const ext = name.substring(extIndex);
            const baseName = name.substring(0, extIndex);
            if (baseName.length + ext.length <= maxLength) return name;
            return baseName.substring(0, maxLength - 3 - ext.length) + "..." + ext;
        } catch (e) {
            return name.substring(0, maxLength - 3) + "..."; // Fallback
        }
    }

    function addChatMessage(content, sender = 'user', files = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(15px)';

        if (sender === 'user') {
            if (files && files.length > 0) {
                const attachmentsContainer = document.createElement('div');
                attachmentsContainer.classList.add('user-message-attachments');
                files.forEach(file => {
                    const tag = document.createElement('div');
                    tag.classList.add('user-message-attachment-tag');
                    const icon = file.type.startsWith('image/') ? SVG_ICON_IMAGE : SVG_ICON_FILE;
                    tag.innerHTML = `
                        ${icon}
                        <span class="file-name" title="${file.name}">${truncateFileName(file.name, 15)}</span>
                    `;
                    attachmentsContainer.appendChild(tag);
                });
                messageElement.appendChild(attachmentsContainer);
            }
            const textNode = document.createElement('span'); 
            textNode.textContent = content; // Only text content here
            messageElement.appendChild(textNode);

        } else { 
            const aiHeader = document.createElement('div');
            aiHeader.classList.add('ai-message-header');
            aiHeader.innerHTML = `
                <img src="logo.png" alt="Novaria Logo" class="ai-logo">
                <span class="ai-name">Novaria</span>
                <span class="ai-model-tag">nova-3.5-quantify</span>
            `;
            messageElement.appendChild(aiHeader);

            const aiBody = document.createElement('div'); 
            aiBody.classList.add('ai-message-body-content'); // Class for easier targeting
            aiBody.innerHTML = content; 
            messageElement.appendChild(aiBody);
        }
        
        chatHistory.insertBefore(messageElement, thinkingIndicator);
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
        const aiBodyContent = aiMessageElement.querySelector('.ai-message-body-content');

        if (!aiBodyContent || aiBodyContent.querySelector('.ai-message-actions')) return;
        
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('ai-message-actions');

        const getResponseText = (contentSourceEl) => { 
            return Array.from(contentSourceEl.childNodes)
                .filter(node => node.nodeName === "SPAN" || node.nodeType === 3) 
                .map(node => node.textContent).join('').trim(); 
        };
        const getFullContent = (contentSourceEl) => { 
            let fullContent = getResponseText(contentSourceEl); 
            contentSourceEl.querySelectorAll('.code-block').forEach(codeBlock => { 
                const lang = codeBlock.querySelector('.language-tag').textContent.toLowerCase(); 
                const code = codeBlock.querySelector('pre').textContent; 
                fullContent += `\n\n\`\`\`${lang}\n${code}\n\`\`\``; 
            }); 
            return fullContent; 
        };
        
        // Buttons definition - DIASUMSIKAN SAMA DENGAN KODE AWAL ANDA
        const buttons = [
            { name: 'copy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', title: 'Copy Response', action: (buttonEl, messageElSource) => { const fullContent = getFullContent(messageElSource); navigator.clipboard.writeText(fullContent).then(() => { buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #66bb6a;"><polyline points="20 6 9 17 4 12"></polyline></svg>'; buttonEl.title = 'Copied!'; setTimeout(() => { buttonEl.innerHTML = buttons[0].icon; buttonEl.title = buttons[0].title; }, 2000); }).catch(err => { console.error('Failed to copy: ', err); }); } },
            { name: 'speak', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>', title: 'Read Aloud', action: (buttonEl, messageElSource) => { const textToSpeak = getResponseText(messageElSource); const speechApi = window.speechSynthesis; if (speechApi.speaking) { speechApi.cancel(); return; } if (textToSpeak) { const utterance = new SpeechSynthesisUtterance(textToSpeak); utterance.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; const originalIcon = buttonEl.innerHTML; buttonEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulsing"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'; utterance.onend = () => { buttonEl.innerHTML = originalIcon; }; speechApi.speak(utterance); } } },
            { name: 'like', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"></path></svg>', title: 'Like', action: (buttonEl) => { buttonEl.classList.toggle('liked'); } },
            { name: 'regenerate', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>', title: 'Regenerate', action: (buttonEl, messageElSource) => { const svg = buttonEl.querySelector('svg'); svg.classList.add('rotating'); buttonEl.disabled = true; buttonEl.style.cursor = 'wait'; const lastUserMessageElements = Array.from(chatHistory.querySelectorAll('.user-message')); const lastUserMessageElement = lastUserMessageElements.pop(); if (lastUserMessageElement) { const userMessageText = lastUserMessageElement.querySelector(':scope > span').textContent; const userFiles = []; lastUserMessageElement.querySelectorAll('.user-message-attachment-tag').forEach(tag => { /* Logic to reconstruct file objects or details if needed for regenerate, currently complex to do from DOM only */ }); aiMessageElement.remove(); generateRealAIResponse(userMessageText, userFiles /* pass reconstructed files if needed */); } else { svg.classList.remove('rotating'); buttonEl.disabled = false; buttonEl.style.cursor = 'pointer'; } } },
            { name: 'share', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>', title: 'Share', action: (buttonEl, messageElSource) => { const fullContent = getFullContent(messageElSource); if (navigator.share) { navigator.share({ title: 'NovaAI Response', text: fullContent, url: window.location.href, }).catch((error) => console.log('Error sharing', error)); } else { navigator.clipboard.writeText(fullContent).then(() => { buttonEl.title = "Not supported, copied instead!"; setTimeout(() => { buttonEl.title = buttons[4].title; }, 2000); }); } } }
        ];

        buttons.forEach((btnInfo) => { const button = document.createElement('button'); button.classList.add('ai-action-btn'); button.title = btnInfo.title; button.innerHTML = btnInfo.icon; button.addEventListener('click', () => btnInfo.action(button, aiBodyContent)); actionsContainer.appendChild(button); });
        
        aiBodyContent.appendChild(actionsContainer);
        setTimeout(() => { chatHistory.scrollTop = chatHistory.scrollHeight; }, 0);
    }

    async function generateRealAIResponse(userMessage, files = []) {
        thinkingIndicator.classList.remove('hidden');
        thinkingIndicator.style.opacity = '1';
        setTimeout(() => { chatHistory.scrollTop = chatHistory.scrollHeight; checkScrollable(); }, 0);

        try {
            const modelToUse = "gemini";
            const payload = { userMessage, model: modelToUse };

            if (files && files.length > 0) {
                payload.fileDetails = files.map(f => ({ 
                    name: f.name, type: f.type, size: f.size 
                }));
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
                // clearAttachedFiles(); // Don't clear here, clear on send
                checkScrollable();
            }, 300);

        } catch (error) { 
            console.error('Error fetching from /api/generate:', error);
            thinkingIndicator.style.opacity = '0';
            setTimeout(() => {
                thinkingIndicator.classList.add('hidden');
                const errorMessage = `<span>Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.</span>`;
                const errorMsgEl = addChatMessage(errorMessage, 'ai'); 
                addAiMessageActions(errorMsgEl); // Tambah action ke pesan error juga
            }, 300);
        }
    }
    
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        const filesToSend = [...attachedFiles]; 

        if (message !== '' || filesToSend.length > 0) {
            let userPrompt = message;
             if (filesToSend.length > 0 && message === '') {
                userPrompt = currentLanguage === 'id' ? `Menganalisis ${filesToSend.length} file...` : `Analyzing ${filesToSend.length} file(s)...`;
            }
            
            if (currentActivePage === 'welcome') {
                showPage('chat', userPrompt, filesToSend); 
            } else {
                addChatMessage(userPrompt, 'user', filesToSend); 
                generateRealAIResponse(userPrompt, filesToSend); 
            }
            
            messageInput.value = '';
            autoResizeTextarea(); 
            clearAttachedFiles(); // Clear after successful send attempt
            
            if (currentActivePage === 'welcome' && messageInput.value.trim() === '' && attachedFiles.length === 0) {
                quickCompleteContainer.classList.add('active');
            } else {
                quickCompleteContainer.classList.remove('active');
            }
        }
    });

    messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendButton.click(); } });

    const initialChatMessageFromStorage = localStorage.getItem('initialChatMessage');
    if (initialChatMessageFromStorage) { localStorage.removeItem('initialChatMessage'); showPage('chat', initialChatMessageFromStorage); } 
    // else { showPage(currentActivePage); } // Moved to the end

    menuIcon.addEventListener('click', () => { sidebar.classList.add('active'); sidebarOverlay.classList.add('active'); });
    sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); });
    backIcon.addEventListener('click', () => { 
        showPage('welcome');
        // Clear only non-thinking indicator messages from chat history
        const messages = Array.from(chatHistory.children);
        messages.forEach(msg => { if (msg.id !== 'thinkingIndicator') msg.remove();});
        thinkingIndicator.classList.add('hidden'); // Ensure thinking indicator is hidden
        messageInput.value = '';
        autoResizeTextarea();
        clearAttachedFiles(); 
        updateInputAreaPadding();
        if (currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    });

    const savedTheme = localStorage.getItem('novaai_theme');
    if (savedTheme === 'light-mode') { document.body.classList.add('light-mode'); themeToggle.checked = true; themeToggleLanding.checked = true; } 
    else { document.body.classList.remove('light-mode'); themeToggle.checked = false; themeToggleLanding.checked = false; }
    function applyTheme(isLightMode) { if (isLightMode) { document.body.classList.add('light-mode'); localStorage.setItem('novaai_theme', 'light-mode'); } else { document.body.classList.remove('light-mode'); localStorage.setItem('novaai_theme', 'dark-mode'); } themeToggle.checked = isLightMode; themeToggleLanding.checked = isLightMode; }
    themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));
    themeToggleLanding.addEventListener('change', () => applyTheme(themeToggleLanding.checked));
    
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
        // Update placeholder if input is empty
        if(messageInput.value.trim() === '' && (!recognition || !recognition.recording)) {
             animatePlaceholder(); // re-init placeholder with new lang
        }
    }

    function updateQuickSuggestions(lang) { 
        quickCompleteContainer.innerHTML = '';
        const suggestions = translations[lang] ? translations[lang].quickSuggestions : translations['en'].quickSuggestions; // Fallback
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
                messageInput.value = ''; // Clear input after using suggestion
                autoResizeTextarea();
                messageInput.focus();
                clearInterval(placeholderInterval);
                quickCompleteContainer.classList.remove('active');
                clearAttachedFiles(); 
            });
            quickCompleteContainer.appendChild(button);
        });
        if (messageInput.value.trim() === '' && attachedFiles.length === 0 && currentActivePage === 'welcome') {
            quickCompleteContainer.classList.add('active');
        }
    }
    
    languageSelect.value = currentLanguage;
    // updateTextContent(currentLanguage); // Called at the end now
    languageSelect.addEventListener('change', (event) => { currentLanguage = event.target.value; localStorage.setItem('novaai_language', currentLanguage); updateTextContent(currentLanguage); if (recognition) { recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US'; } });

    function openModal(titleKey, contentKey) { 
        modalTitleElement.textContent = translations[currentLanguage]?.[titleKey] || titleKey; // Fallback to key
        modalBody.innerHTML = translations[currentLanguage]?.[contentKey] || `Content for ${contentKey} not found.`; // Fallback
        infoModalOverlay.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
    }
    function closeModal() { infoModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
    modalCloseBtn.addEventListener('click', closeModal);
    infoModalOverlay.addEventListener('click', (e) => { if (e.target === infoModalOverlay) { closeModal(); } });
    document.querySelectorAll('.sidebar-item[data-modal-target]').forEach(item => { item.addEventListener('click', function (e) { e.preventDefault(); sidebar.classList.remove('active'); sidebarOverlay.classList.remove('active'); const targetKey = this.dataset.modalTarget; const titleKey = targetKey; const contentKey = targetKey + 'Content'; openModal(titleKey, contentKey); }); });

    function setupRippleEffects() {
        const clickableElements = document.querySelectorAll('.btn-circle, .icon-btn, .sidebar-item, .quick-complete-btn, .ai-action-btn, .copy-code-btn');
        clickableElements.forEach(element => {
            const oldHandler = element._rippleHandler;
            if (oldHandler) { element.removeEventListener('click', oldHandler); }
            const newHandler = function (e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
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
                ripple.addEventListener('animationend', () => { ripple.remove(); });
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
                        if (node.matches && (node.matches('.ai-action-btn') || node.matches('.copy-code-btn') || node.matches('.quick-complete-btn'))) {
                            needsRippleSetup = true;
                        } else if (node.querySelector && (node.querySelector('.ai-action-btn') || node.querySelector('.copy-code-btn') || node.querySelector('.quick-complete-btn'))) {
                            needsRippleSetup = true;
                        }
                    }
                });
                if (needsRippleSetup) { setupRippleEffects(); }
            }
        });
    });
    observer.observe(chatHistory, { childList: true, subtree: true });
    observer.observe(quickCompleteContainer, { childList: true, subtree: true }); 

    function updateInputAreaPadding() {
        const inputWrapperHeight = inputWrapper.offsetHeight;
        const pendingFilesContainerActualHeight = (attachedFiles.length > 0 && pendingFilesPreviewContainer.style.display !== 'none') 
                                           ? pendingFilesPreviewContainer.offsetHeight + 10 /* gap */ 
                                           : 0;
        const totalBottomSpace = inputWrapperHeight + 15 + pendingFilesContainerActualHeight;
        mainContent.style.paddingBottom = `${totalBottomSpace + 20}px`; 
        // chatHistory.scrollTop = chatHistory.scrollHeight; // No immediate scroll needed on padding update unless content added

        const quickCompleteBottomOffset = inputWrapperHeight + 15 + pendingFilesContainerActualHeight + 10;
        quickCompleteContainer.style.bottom = `${quickCompleteBottomOffset}px`;
        pendingFilesPreviewContainer.style.bottom = `${inputWrapperHeight + 15}px`;
    }
    
    plusButton.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            if (attachedFiles.length + files.length > MAX_FILES) {
                alert(currentLanguage === 'id' ? `Anda hanya dapat melampirkan maksimal ${MAX_FILES} file.` : `You can only attach a maximum of ${MAX_FILES} files.`);
                fileInput.value = ''; 
                return;
            }
            let addedCount = 0;
            Array.from(files).forEach(file => {
                if (attachedFiles.length >= MAX_FILES) return; // Stop if max already reached by previous files in this batch

                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`File "${file.name}" (${(file.size / 1024).toFixed(1)} KB) ${currentLanguage === 'id' ? 'melebihi ukuran maksimum' : 'exceeds the maximum size of'} ${MAX_FILE_SIZE_KB} KB.`);
                } else {
                    const isDuplicate = attachedFiles.some(f => f.name === file.name && f.size === file.size);
                    if (!isDuplicate) {
                        attachedFiles.push(file); 
                        displayPendingFile(file);
                        addedCount++;
                    } else {
                        alert(currentLanguage === 'id' ? `File "${file.name}" sudah dilampirkan.` : `File "${file.name}" is already attached.`);
                    }
                }
            });
            fileInput.value = ''; 
            if (addedCount > 0) {
                quickCompleteContainer.classList.remove('active');
                updateInputAreaPadding(); 
                autoResizeTextarea(); 
            }
        }
    });

    function displayPendingFile(file) {
        const fileTag = document.createElement('div');
        fileTag.classList.add('pending-file-tag');
        fileTag.dataset.fileName = file.name; 
        fileTag.dataset.fileSize = file.size;

        const iconSvg = file.type.startsWith('image/') ? SVG_ICON_IMAGE : SVG_ICON_FILE;
        const fileNameDisplay = truncateFileName(file.name, 25); 
        const fileSizeKB = (file.size / 1024).toFixed(1);

        fileTag.innerHTML = `
            ${iconSvg}
            <div class="file-details">
                <span class="file-name" title="${file.name}">${fileNameDisplay}</span>
                <span class="file-size">${fileSizeKB} KB</span>
            </div>
            <button class="remove-file-btn" title="${currentLanguage === 'id' ? 'Hapus' : 'Remove'} ${file.name}">×</button>
        `;

        fileTag.querySelector('.remove-file-btn').addEventListener('click', () => {
            removeAttachedFile(file.name, file.size.toString()); // Pass size as string
        });

        pendingFilesPreviewContainer.appendChild(fileTag);
        pendingFilesPreviewContainer.style.display = 'flex'; 
        updateInputAreaPadding(); 
        autoResizeTextarea();
    }

    function removeAttachedFile(fileName, fileSizeStr) { 
        const fileSizeNum = parseInt(fileSizeStr);
        attachedFiles = attachedFiles.filter(file => !(file.name === fileName && file.size === fileSizeNum));
        
        const fileItemToRemove = pendingFilesPreviewContainer.querySelector(`.pending-file-tag[data-file-name="${CSS.escape(fileName)}"][data-file-size="${fileSizeStr}"]`); // CSS.escape for special chars in name
        if (fileItemToRemove) {
            fileItemToRemove.remove();
        }

        if (attachedFiles.length === 0) {
            pendingFilesPreviewContainer.style.display = 'none';
            if (messageInput.value.trim() === '' && currentActivePage === 'welcome' && (!recognition || !recognition.recording)) {
                quickCompleteContainer.classList.add('active');
            }
        }
        updateInputAreaPadding();
        autoResizeTextarea();
    }

    function clearAttachedFiles() {
        attachedFiles = [];
        pendingFilesPreviewContainer.innerHTML = '';
        pendingFilesPreviewContainer.style.display = 'none';
        updateInputAreaPadding();
        autoResizeTextarea();
        if (messageInput.value.trim() === '' && currentActivePage === 'welcome' && (!recognition || !recognition.recording)) {
            quickCompleteContainer.classList.add('active');
        }
    }
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage === 'id' ? 'id-ID' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true; // Set to true for live transcription
        let finalTranscript = '';

        recognition.onstart = () => {
            console.log('Voice recognition started.');
            voiceInputButton.style.backgroundColor = 'var(--button-hover-bg)'; // Or a specific recording color
            messageInput.placeholder = currentLanguage === 'id' ? 'Mendengarkan...' : 'Listening...';
            clearInterval(placeholderInterval); // Stop placeholder animation while listening
            recognition.recording = true; // Custom flag
        };
        recognition.onresult = (event) => {
            let interimTranscript = '';
            finalTranscript = ''; // Reset final transcript on each new result event if not continuous
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            messageInput.value = finalTranscript + interimTranscript; // Show interim results
            autoResizeTextarea();
        };
        recognition.onend = () => {
            console.log('Voice recognition ended.');
            voiceInputButton.style.backgroundColor = ''; 
            recognition.recording = false;
            // finalTranscript is already set by the last 'final' result event.
            // If interim results were the last thing, messageInput.value will have them.
            // No need to click sendButton automatically unless desired.

            if (messageInput.value.trim() === '') {
                 messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex]; // Restore placeholder if empty
                 placeholderInterval = setInterval(animatePlaceholder, 3000); // Restart animation
            }
            finalTranscript = ''; // Reset for next session.
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceInputButton.style.backgroundColor = '';
            recognition.recording = false;
            if (messageInput.value.trim() === '') { // Only restore placeholder if input is actually empty
                 messageInput.placeholder = placeholders[currentLanguage][currentPlaceholderIndex];
                 placeholderInterval = setInterval(animatePlaceholder, 3000);
            }
            finalTranscript = '';
            // Avoid alert for common errors like 'no-speech' or 'aborted'
            if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'audio-capture') {
                 alert('Speech recognition error: ' + event.error);
            }
        };
        voiceInputButton.addEventListener('click', () => {
            try {
                if (recognition && recognition.recording) { // Check custom flag
                    recognition.stop();
                } else {
                    recognition.start();
                }
            } catch (e) {
                console.warn('Recognition API error or already started/stopped:', e);
                 if (recognition && typeof recognition.stop === 'function' && recognition.recording) {
                     recognition.stop();
                 }
                 voiceInputButton.style.backgroundColor = ''; // Ensure UI reset
                 recognition.recording = false;
            }
        });
    } else {
        voiceInputButton.style.display = 'none'; 
        console.warn('Web Speech API not supported in this browser.');
    }
    
    // Initial UI setup calls
    updateTextContent(currentLanguage); 
    updateInputAreaPadding(); 
    showPage(currentActivePage, initialChatMessageFromStorage); // Pass initial message if any

});

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