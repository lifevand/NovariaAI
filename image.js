// image.js - Logika untuk halaman Generate Image

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser');
    if (!isLoggedIn || !storedUser) {
        localStorage.setItem('redirectAfterLogin', 'image.html');
        window.location.href = 'login.html';
        return;
    }

    const imagePromptInput = document.getElementById('imagePromptInput');
    const generateImageButton = document.getElementById('generateImageButton');
    const imageResultContainer = document.getElementById('imageResultContainer');
    const generatedImage = document.getElementById('generatedImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const loadingIndicatorImage = document.getElementById('loadingIndicatorImage');
    const currentYearImagePage = document.getElementById('currentYearImagePage');
    const themeToggleImagePage = document.getElementById('themeToggleImagePage');
    const loadingText = loadingIndicatorImage ? loadingIndicatorImage.querySelector('p') : null; // Ambil elemen teks loading

    let retryTimeoutId = null; // Untuk timeout retry otomatis

    if (currentYearImagePage) {
        currentYearImagePage.textContent = new Date().getFullYear();
    }

    // --- Logika Theme Toggle untuk image.html ---
    function applyImagePageTheme(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
        localStorage.setItem('novaria_theme', isLightMode ? 'light' : 'dark');
    }
    if (themeToggleImagePage) {
        const savedTheme = localStorage.getItem('novaria_theme');
        const isLight = savedTheme === 'light';
        themeToggleImagePage.checked = isLight;
        applyImagePageTheme(isLight);
        themeToggleImagePage.addEventListener('change', () => {
            applyImagePageTheme(themeToggleImagePage.checked);
        });
    }
    // --- Akhir Logika Theme Toggle ---

    function showLoading(message = "Sedang membuat gambar...") {
        if (generateImageButton) generateImageButton.disabled = true;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'flex';
        if (loadingText) loadingText.textContent = message;
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
        if (generatedImage) generatedImage.style.display = 'none';
    }

    function hideLoading() {
        if (generateImageButton) generateImageButton.disabled = false;
        if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'none';
        if (loadingText) loadingText.textContent = "Sedang membuat gambar..."; // Reset teks loading
    }

    function showError(errorMessage) {
        hideLoading();
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex';
            const p = imagePlaceholder.querySelector('p');
            if (p) p.textContent = `Error: ${errorMessage}`;
        }
        if (generatedImage) generatedImage.style.display = 'none';
    }

    function showImage(imageUrl, prompt) {
        hideLoading();
        if (generatedImage) {
            generatedImage.src = imageUrl;
            generatedImage.alt = `AI Generated: ${prompt}`;
            generatedImage.style.display = 'block';
        }
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
    }
    
    async function submitImageRequest() {
        const prompt = imagePromptInput.value.trim();
        if (!prompt) {
            alert("Masukkan deskripsi gambar terlebih dahulu!");
            imagePromptInput.focus();
            return;
        }

        showLoading();
        clearTimeout(retryTimeoutId); // Hapus timeout retry sebelumnya jika ada

        try {
            const response = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            const data = await response.json(); // Selalu coba parse JSON dulu

            if (!response.ok) {
                // Jika backend mengirim errorType 'model_loading'
                if (data.errorType === 'model_loading' && data.estimated_time) {
                    const waitTime = Math.max(data.estimated_time, 5); // Minimal tunggu 5 detik
                    showLoading(`Model sedang dimuat oleh server AI, perkiraan waktu tunggu ${waitTime} detik. Mencoba lagi otomatis...`);
                    // Jadwalkan retry otomatis
                    retryTimeoutId = setTimeout(() => {
                        console.log(`Retrying image generation for prompt: "${prompt}"`);
                        submitImageRequest(); // Panggil fungsi ini lagi
                    }, waitTime * 1000); 
                    return; // Jangan lanjutkan, tunggu retry
                }
                throw new Error(data.message || `Gagal membuat gambar (status: ${response.status})`);
            }

            if (data.imageUrl) {
                showImage(data.imageUrl, prompt);
            } else {
                throw new Error("Tidak ada URL gambar yang diterima dari server.");
            }

        } catch (error) {
            console.error("Error generating image:", error);
            showError(error.message);
        } 
        // finally block tidak lagi memanggil hideLoading() karena loading dihandle oleh showError atau showImage,
        // dan untuk kasus model_loading, kita ingin loading tetap tampil.
    }


    if (generateImageButton && imagePromptInput) {
        generateImageButton.addEventListener('click', submitImageRequest);
        imagePromptInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitImageRequest();
            }
        });
    }
});
