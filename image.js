// image.js - Logika untuk halaman Generate Image

document.addEventListener('DOMContentLoaded', () => {
    // Pengecekan login sederhana, jika tidak ada user, arahkan ke login
    // dan simpan state bahwa kita ingin kembali ke image.html
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser'); // Pastikan key ini konsisten dengan login.js
    if (!isLoggedIn || !storedUser) {
        localStorage.setItem('redirectAfterLogin', 'image.html'); // Simpan tujuan setelah login
        window.location.href = 'login.html';
        return; // Hentikan eksekusi script jika belum login
    }

    // Selektor elemen DOM
    const imagePromptInput = document.getElementById('imagePromptInput');
    const generateImageButton = document.getElementById('generateImageButton');
    const imageResultContainer = document.getElementById('imageResultContainer');
    const generatedImage = document.getElementById('generatedImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const loadingIndicatorImage = document.getElementById('loadingIndicatorImage');
    const currentYearImagePage = document.getElementById('currentYearImagePage');
    const themeToggleImagePage = document.getElementById('themeToggleImagePage');
    
    // Ambil elemen teks di dalam loading indicator untuk pesan dinamis
    const loadingTextMessage = loadingIndicatorImage ? loadingIndicatorImage.querySelector('p') : null;

    // Variabel untuk mekanisme retry
    let retryTimeoutId = null;
    let currentRetryCount = 0;
    const MAX_AUTO_RETRIES = 3; // Maksimal percobaan otomatis
    const RETRY_BASE_DELAY_MS = 10000; // Minimal waktu tunggu sebelum retry otomatis (10 detik)
    let currentPromptForManualRetry = ""; // Simpan prompt untuk tombol "Coba Lagi" manual

    // Inisialisasi tahun di footer
    if (currentYearImagePage) {
        currentYearImagePage.textContent = new Date().getFullYear();
    }

    // --- Logika Theme Toggle untuk image.html ---
    function applyImagePageTheme(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('novaria_theme', isLightMode ? 'light' : 'dark'); // Gunakan key localStorage yang sama
    }

    if (themeToggleImagePage) {
        const savedTheme = localStorage.getItem('novaria_theme');
        const isCurrentlyLight = savedTheme === 'light';
        themeToggleImagePage.checked = isCurrentlyLight;
        applyImagePageTheme(isCurrentlyLight); // Terapkan tema saat load

        themeToggleImagePage.addEventListener('change', () => {
            applyImagePageTheme(themeToggleImagePage.checked);
        });
    }
    // --- Akhir Logika Theme Toggle ---

    // --- Fungsi untuk Mengelola UI ---
    function showLoadingState(message = "Sedang membuat gambar...") {
        if (generateImageButton) generateImageButton.disabled = true;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'flex';
        if (loadingTextMessage) loadingTextMessage.textContent = message;
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
        if (generatedImage) generatedImage.style.display = 'none';
        // Hapus tombol retry manual jika ada
        const existingRetryButton = imageResultContainer?.querySelector('.manual-retry-button');
        if (existingRetryButton) existingRetryButton.remove();
    }

    function hideLoadingState() {
        if (generateImageButton) generateImageButton.disabled = false;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'none';
        if (loadingTextMessage) loadingTextMessage.textContent = "Sedang membuat gambar..."; // Reset teks
    }

    function displayGeneratedImage(imageUrl, promptText) {
        hideLoadingState();
        currentRetryCount = 0; // Reset hitungan retry jika berhasil
        currentPromptForManualRetry = ""; 
        if (generatedImage) {
            generatedImage.src = imageUrl;
            generatedImage.alt = `AI Generated: ${promptText}`;
            generatedImage.style.display = 'block';
        }
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
    }

    function displayErrorState(errorMessage, allowManualRetry = false) {
        hideLoadingState();
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex'; // Tampilkan area placeholder untuk pesan error
            const p = imagePlaceholder.querySelector('p');
            if (p) p.textContent = `Error: ${errorMessage}`;

            // Hapus tombol retry manual sebelumnya jika ada
            const existingRetryButton = imagePlaceholder.querySelector('.manual-retry-button');
            if (existingRetryButton) existingRetryButton.remove();

            if (allowManualRetry && currentPromptForManualRetry) {
                const retryButton = document.createElement('button');
                retryButton.textContent = "Coba Lagi Manual";
                retryButton.className = "card-cta-button manual-retry-button"; // Gunakan style tombol yang sudah ada
                retryButton.style.marginTop = "15px";
                retryButton.style.maxWidth = "220px";
                retryButton.style.margin = "15px auto 0 auto"; // Tengahkankan
                retryButton.onclick = () => {
                    if (p) p.textContent = "Gambar Anda akan muncul di sini"; // Reset pesan placeholder
                    retryButton.remove(); 
                    currentRetryCount = 0; // Reset hitungan retry otomatis jika coba manual
                    submitImageGenerationRequest(currentPromptForManualRetry); // Kirim lagi
                };
                imagePlaceholder.appendChild(retryButton);
            }
        }
        if (generatedImage) generatedImage.style.display = 'none';
    }
    
    // --- Fungsi Utama untuk Generate Gambar ---
    async function submitImageGenerationRequest(promptTextToUse) {
        // Jika promptTextToUse tidak diberikan (panggilan awal), ambil dari input
        const currentPrompt = promptTextToUse || (imagePromptInput ? imagePromptInput.value.trim() : "");

        if (!currentPrompt) {
            alert("Masukkan deskripsi gambar terlebih dahulu!");
            if (imagePromptInput) imagePromptInput.focus();
            return;
        }
        
        currentPromptForManualRetry = currentPrompt; // Simpan untuk potensi retry manual

        showLoadingState(); // Tampilkan UI loading awal
        clearTimeout(retryTimeoutId); // Hapus timeout retry otomatis sebelumnya

        try {
            const response = await fetch('/api/image', { // Pastikan endpoint ini benar
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt }),
            });

            const data = await response.json(); // Selalu coba parse JSON

            if (!response.ok) {
                // Cek apakah ini error karena model loading dari backend
                if (data && data.errorType === 'model_loading' && data.estimated_time) {
                    if (currentRetryCount < MAX_AUTO_RETRIES) {
                        currentRetryCount++;
                        const waitTimeSeconds = Math.max(data.estimated_time, 10); // Minimal tunggu 10 detik
                        showLoadingState(`Model AI sedang disiapkan (otomatis coba lagi ke-${currentRetryCount}/${MAX_AUTO_RETRIES}). Perkiraan ${waitTimeSeconds} detik...`);
                        
                        retryTimeoutId = setTimeout(() => {
                            console.log(`Retrying image generation for: "${currentPrompt}" (Attempt ${currentRetryCount})`);
                            submitImageGenerationRequest(currentPrompt); // Rekursif panggil dengan prompt yang sama
                        }, waitTimeSeconds * 1000);
                        return; // Hentikan eksekusi saat ini, tunggu retry
                    } else {
                        // Sudah mencapai batas retry otomatis
                        throw new Error(`Model AI masih sibuk setelah ${MAX_AUTO_RETRIES} percobaan otomatis. Silakan coba lagi secara manual.`);
                    }
                }
                // Jika error lain dari backend
                throw new Error(data.message || `Gagal membuat gambar (Status: ${response.status})`);
            }

            // Jika sukses
            if (data.imageUrl) {
                displayGeneratedImage(data.imageUrl, currentPrompt);
            } else {
                throw new Error("Respons berhasil tetapi tidak ada URL gambar yang diterima.");
            }

        } catch (error) {
            console.error("Error during image generation process:", error);
            // Tawarkan retry manual untuk kebanyakan error, kecuali jika sudah gagal retry otomatis berkali-kali
            const offerManualRetry = !(error.message.includes("setelah "+MAX_AUTO_RETRIES+" percobaan otomatis"));
            displayErrorState(error.message, offerManualRetry);
        }
    }

    // Event listener untuk tombol generate dan input prompt
    if (generateImageButton && imagePromptInput) {
        generateImageButton.addEventListener('click', () => submitImageGenerationRequest()); // Panggil tanpa argumen
        
        imagePromptInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitImageGenerationRequest(); // Panggil tanpa argumen
            }
        });
    } else {
        console.error("Elemen input prompt atau tombol generate tidak ditemukan.");
    }
});
