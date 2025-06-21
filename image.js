// image.js - Logika untuk halaman Pencarian Gambar (dimodifikasi dari Generate Image)

document.addEventListener('DOMContentLoaded', () => {
    // Pengecekan login sederhana, jika tidak ada user, arahkan ke login
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser');
    if (!isLoggedIn || !storedUser) {
        localStorage.setItem('redirectAfterLogin', 'image.html');
        window.location.href = 'login.html';
        return; // Hentikan eksekusi script jika belum login
    }

    // Selektor elemen DOM
    const imagePromptInput = document.getElementById('imagePromptInput');
    const searchImageButton = document.getElementById('generateImageButton'); // ID tombol tetap sama, tapi fungsinya jadi search
    const imageResultContainer = document.getElementById('imageResultContainer');
    const displayedImage = document.getElementById('generatedImage'); // ID gambar tetap sama
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const loadingIndicatorImage = document.getElementById('loadingIndicatorImage');
    const currentYearImagePage = document.getElementById('currentYearImagePage');
    const themeToggleImagePage = document.getElementById('themeToggleImagePage');

    const loadingTextMessage = loadingIndicatorImage ? loadingIndicatorImage.querySelector('p') : null;
    let currentPromptForManualRetry = "";

    // Inisialisasi tahun di footer
    if (currentYearImagePage) {
        currentYearImagePage.textContent = new Date().getFullYear();
    }

    // --- Logika Theme Toggle untuk image.html (asumsikan ini sudah benar) ---
    function applyImagePageTheme(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('novaria_theme', isLightMode ? 'light' : 'dark');
    }

    if (themeToggleImagePage) {
        const savedTheme = localStorage.getItem('novaria_theme');
        const isCurrentlyLight = savedTheme === 'light';
        themeToggleImagePage.checked = isCurrentlyLight;
        applyImagePageTheme(isCurrentlyLight);

        themeToggleImagePage.addEventListener('change', () => {
            applyImagePageTheme(themeToggleImagePage.checked);
        });
    }
    // --- Akhir Logika Theme Toggle ---

    // --- Fungsi untuk Mengelola UI ---
    function showLoadingState(message = "Sedang membuat gambar...") {
        if (searchImageButton) searchImageButton.disabled = true;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'flex';
        if (loadingTextMessage) loadingTextMessage.textContent = message;
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
        if (displayedImage) displayedImage.style.display = 'none';
        // Hapus tombol retry manual jika ada
        const existingRetryButton = imageResultContainer?.querySelector('.manual-retry-button');
        if (existingRetryButton) existingRetryButton.remove();
    }

    function hideLoadingState() {
        if (searchImageButton) searchImageButton.disabled = false;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'none';
        if (loadingTextMessage) loadingTextMessage.textContent = "Sedang mencari gambar..."; // Reset teks
    }

    function displaySearchedImage(imageUrl, promptText) {
        hideLoadingState();
        currentPromptForManualRetry = "";
        if (displayedImage) {
            displayedImage.src = imageUrl;
            displayedImage.alt = `Hasil pembuatan untuk: ${promptText}`; // Alt text disesuaikan
            displayedImage.style.display = 'block';
        }
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
    }

    function displayErrorState(errorMessage, allowManualRetry = false) {
        hideLoadingState();
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex';
            const p = imagePlaceholder.querySelector('p');
            if (p) p.textContent = `${errorMessage}`; // Tidak perlu "Error: " lagi, pesan dari backend sudah cukup

            const existingRetryButton = imagePlaceholder.querySelector('.manual-retry-button');
            if (existingRetryButton) existingRetryButton.remove();

            if (allowManualRetry && currentPromptForManualRetry) {
                const retryButton = document.createElement('button');
                retryButton.textContent = "Coba Cari Lagi";
                retryButton.className = "card-cta-button manual-retry-button";
                retryButton.style.marginTop = "15px";
                retryButton.style.maxWidth = "220px";
                retryButton.style.margin = "15px auto 0 auto";
                retryButton.onclick = () => {
                    if (p) p.textContent = "Gambar Anda akan muncul di sini"; // Reset pesan placeholder
                    retryButton.remove();
                    submitImageSearchRequest(currentPromptForManualRetry); // Kirim lagi
                };
                imagePlaceholder.appendChild(retryButton);
            }
        }
        if (displayedImage) displayedImage.style.display = 'none';
    }

    // --- Fungsi Utama untuk Mencari Gambar ---
    async function submitImageSearchRequest(promptTextToUse) {
        const currentPrompt = promptTextToUse || (imagePromptInput ? imagePromptInput.value.trim() : "");

        if (!currentPrompt) {
            alert("Masukkan deskripsi gambar yang ingin digenerate!");
            if (imagePromptInput) imagePromptInput.focus();
            return;
        }

        currentPromptForManualRetry = currentPrompt;
        showLoadingState();

        try {
            // Panggil endpoint backend BARU Anda
            const response = await fetch('/api/google-image-search', { // ENDPOINT BARU
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Error akan ditangani oleh blok catch, data.message akan berisi pesan error dari backend
                throw new Error(data.message || `Gagal membuat gambar (Status: ${response.status})`);
            }

            if (data.imageUrl) {
                displaySearchedImage(data.imageUrl, currentPrompt);
            } else {
                // Seharusnya tidak terjadi jika backend mengembalikan 200 OK
                throw new Error("Respons berhasil tetapi tidak ada URL gambar yang diterima.");
            }

        } catch (error) {
            console.error("Error during image search process:", error);
            // Tombol "Coba Lagi Manual" masih bisa berguna
            // Pesan error dari objek Error (yang mungkin berasal dari data.message backend)
            displayErrorState(error.message, true);
        }
    }

    // Event listener untuk tombol cari dan input prompt
    if (searchImageButton && imagePromptInput) {
        searchImageButton.addEventListener('click', () => submitImageSearchRequest());

        imagePromptInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitImageSearchRequest();
            }
        });

        // Ubah teks tombol jika perlu (misalnya dari "Generate Gambar" menjadi "Cari Gambar")
        searchImageButton.textContent = "Generate Gambar";

    } else {
        console.error("Elemen input prompt atau tombol buat gambar tidak ditemukan.");
    }

    // Ubah judul halaman dan placeholder jika perlu untuk konsistensi
    const pageTitleElement = document.querySelector('.prompt-container h1');
    if (pageTitleElement) {
        pageTitleElement.textContent = "Buat Gambar dengan AI";
    }
    const pageSubtitleElement = document.querySelector('.prompt-container p');
     if (pageSubtitleElement) {
        pageSubtitleElement.textContent = "Masukkan deskripsi detail tentang gambar yang ingin Anda generate.";
    }
    if (imagePromptInput) {
        imagePromptInput.placeholder = "Contoh: Pemandangan gunung bersalju saat matahari terbit...";
    }
    const placeholderTextInsideResult = imagePlaceholder.querySelector('p');
    if (placeholderTextInsideResult) {
        placeholderTextInsideResult.textContent = "Hasil pembuatan gambar Anda akan muncul di sini";
    }


});
