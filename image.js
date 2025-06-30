// image.js - Logika untuk halaman Generate Image

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
    const generateImageButton = document.getElementById('generateImageButton');
    const imageResultContainer = document.getElementById('imageResultContainer');
    const displayedImage = document.getElementById('generatedImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const loadingIndicatorImage = document.getElementById('loadingIndicatorImage');
    const currentYearImagePage = document.getElementById('currentYearImagePage');
    const themeToggleImagePage = document.getElementById('themeToggleImagePage');
    const downloadImageButton = document.getElementById('downloadImageButton'); // Tombol download baru

    const loadingTextMessage = loadingIndicatorImage ? loadingIndicatorImage.querySelector('p') : null;
    let currentPromptForManualRetry = "";

    // Inisialisasi tahun di footer
    if (currentYearImagePage) {
        currentYearImagePage.textContent = new Date().getFullYear();
    }

    // --- Logika Theme Toggle untuk image.html ---
    function applyImagePageTheme(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('novaria_theme', isLightMode ? 'light' : 'dark');
        // Update SVG gradient for placeholder if needed (re-create/update)
        updateImagePlaceholderGradient(isLightMode);
    }

    function updateImagePlaceholderGradient(isLightMode) {
        const svgElement = imagePlaceholder.querySelector('.image-placeholder-icon-svg');
        if (!svgElement) return;

        // Remove existing defs if any
        let defs = svgElement.querySelector('defs');
        if (defs) defs.remove();

        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', 'imageGradient');
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', isLightMode ? '#2563eb' : '#38bdf8'); // Light mode blue, Dark mode blue
        linearGradient.appendChild(stop1);

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', isLightMode ? '#3b82f6' : '#0ea5e9'); // Light mode brighter blue, Dark mode darker blue
        linearGradient.appendChild(stop2);

        defs.appendChild(linearGradient);
        svgElement.insertBefore(defs, svgElement.firstChild); // Insert defs at the beginning of SVG
        svgElement.style.stroke = 'url(#imageGradient)'; // Apply the gradient to the stroke
    }

    if (themeToggleImagePage) {
        const savedTheme = localStorage.getItem('novaria_theme');
        const isCurrentlyLight = savedTheme === 'light';
        themeToggleImagePage.checked = isCurrentlyLight;
        applyImagePageTheme(isCurrentlyLight); // Initial theme application

        themeToggleImagePage.addEventListener('change', () => {
            applyImagePageTheme(themeToggleImagePage.checked);
        });
    } else {
        // Fallback for initial gradient if no theme toggle is found or ready
        applyImagePageTheme(document.body.classList.contains('light-mode'));
    }
    // --- Akhir Logika Theme Toggle ---

    // --- Fungsi untuk Mengelola UI ---
    function showLoadingState(message = "Sedang membuat gambar...") {
        if (generateImageButton) generateImageButton.disabled = true;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'flex';
        if (loadingTextMessage) loadingTextMessage.textContent = message;
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
        if (displayedImage) displayedImage.style.display = 'none';
        if (downloadImageButton) downloadImageButton.style.display = 'none'; // Sembunyikan tombol download
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
        currentPromptForManualRetry = "";
        if (displayedImage) {
            displayedImage.src = imageUrl;
            displayedImage.alt = `Hasil pembuatan untuk: ${promptText}`;
            displayedImage.style.display = 'block';
        }
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
        if (downloadImageButton) downloadImageButton.style.display = 'flex'; // Tampilkan tombol download
    }

    function displayErrorState(errorMessage, allowManualRetry = false) {
        hideLoadingState();
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex';
            const p = imagePlaceholder.querySelector('p');
            if (p) p.textContent = `${errorMessage}`;

            const existingRetryButton = imagePlaceholder.querySelector('.manual-retry-button');
            if (existingRetryButton) existingRetryButton.remove();

            if (allowManualRetry && currentPromptForManualRetry) {
                const retryButton = document.createElement('button');
                retryButton.textContent = "Coba Buat Lagi";
                retryButton.className = "card-cta-button manual-retry-button";
                retryButton.style.marginTop = "15px";
                retryButton.style.maxWidth = "220px";
                retryButton.style.margin = "15px auto 0 auto";
                retryButton.onclick = () => {
                    if (p) p.textContent = "Gambar akan muncul disini."; // Reset pesan placeholder
                    retryButton.remove();
                    submitImageGenerationRequest(currentPromptForManualRetry); // Kirim lagi
                };
                imagePlaceholder.appendChild(retryButton);
            }
        }
        if (displayedImage) displayedImage.style.display = 'none';
        if (downloadImageButton) downloadImageButton.style.display = 'none'; // Sembunyikan tombol download
    }

    // --- Fungsi Utama untuk Membuat Gambar ---
    async function submitImageGenerationRequest(promptTextToUse) {
        const currentPrompt = promptTextToUse || (imagePromptInput ? imagePromptInput.value.trim() : "");

        if (!currentPrompt) {
            alert("Masukkan deskripsi gambar yang ingin digenerate!");
            if (imagePromptInput) imagePromptInput.focus();
            return;
        }

        currentPromptForManualRetry = currentPrompt;
        showLoadingState();

        try {
            const response = await fetch('/api/google-image-search', { // Tetap gunakan endpoint ini
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Gagal membuat gambar (Status: ${response.status})`);
            }

            if (data.imageUrl) {
                displayGeneratedImage(data.imageUrl, currentPrompt);
            } else {
                throw new Error("Respons berhasil tetapi tidak ada URL gambar yang diterima.");
            }

        } catch (error) {
            console.error("Error during image generation process:", error);
            displayErrorState(error.message, true);
        }
    }

    // --- Fungsi Download Gambar ---
    if (downloadImageButton && displayedImage) {
        downloadImageButton.addEventListener('click', async () => {
            if (!displayedImage.src || displayedImage.src === '#') {
                alert("Tidak ada gambar untuk diunduh.");
                return;
            }

            try {
                // Fetch the image as a Blob
                const response = await fetch(displayedImage.src);
                const blob = await response.blob();

                // Create a temporary URL for the Blob
                const url = window.URL.createObjectURL(blob);

                // Create a temporary <a> element
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                // Suggest a filename (you can make this more dynamic, e.g., based on prompt)
                a.download = `novaria-image-${Date.now()}.png`; // Example filename

                document.body.appendChild(a);
                a.click(); // Programmatically click the link to trigger download
                window.URL.revokeObjectURL(url); // Clean up the URL object

            } catch (error) {
                console.error("Error downloading image:", error);
                alert("Gagal mengunduh gambar. Silakan coba lagi.");
            }
        });
    }

    // Event listener untuk tombol generate dan input prompt
    if (generateImageButton && imagePromptInput) {
        generateImageButton.addEventListener('click', () => submitImageGenerationRequest());

        imagePromptInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitImageGenerationRequest();
            }
        });
    } else {
        console.error("Elemen input prompt atau tombol generate gambar tidak ditemukan.");
    }
});