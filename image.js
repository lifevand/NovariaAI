// image.js - Logika untuk halaman Generate Image

document.addEventListener('DOMContentLoaded', () => {
    // Pengecekan login sederhana, jika tidak ada user, arahkan ke login
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('novaUser');
    if (!isLoggedIn || !storedUser) {
        // Simpan bahwa kita ingin kembali ke image.html setelah login
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

    if (currentYearImagePage) {
        currentYearImagePage.textContent = new Date().getFullYear();
    }

    // Logika Theme Toggle untuk image.html
    function applyImagePageTheme(isLightMode) {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('novaria_theme', 'light'); // Gunakan key localStorage yang sama
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('novaria_theme', 'dark');
        }
    }

    if (themeToggleImagePage) {
        const savedTheme = localStorage.getItem('novaria_theme');
        if (savedTheme === 'light') {
            themeToggleImagePage.checked = true;
            applyImagePageTheme(true);
        } else {
            themeToggleImagePage.checked = false;
            applyImagePageTheme(false);
        }
        themeToggleImagePage.addEventListener('change', () => {
            applyImagePageTheme(themeToggleImagePage.checked);
        });
    }
    // Akhir Logika Theme Toggle

    if (generateImageButton && imagePromptInput) {
        generateImageButton.addEventListener('click', async () => {
            const prompt = imagePromptInput.value.trim();
            if (!prompt) {
                alert("Masukkan deskripsi gambar terlebih dahulu!");
                imagePromptInput.focus();
                return;
            }

            generateImageButton.disabled = true;
            if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'flex';
            if (imagePlaceholder) imagePlaceholder.style.display = 'none';
            if (generatedImage) generatedImage.style.display = 'none';

            try {
                const response = await fetch('/api/image', { // Memanggil endpoint /api/image.js
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Gagal membuat gambar (status: ${response.status})`);
                }

                const data = await response.json();
                if (data.imageUrl) {
                    if (generatedImage) {
                        generatedImage.src = data.imageUrl;
                        generatedImage.alt = `AI Generated: ${prompt}`;
                        generatedImage.style.display = 'block';
                    }
                    if (imagePlaceholder) imagePlaceholder.style.display = 'none';
                } else {
                    throw new Error("Tidak ada URL gambar yang diterima dari server.");
                }

            } catch (error) {
                console.error("Error generating image:", error);
                if (imagePlaceholder) {
                     imagePlaceholder.style.display = 'flex'; // Tampilkan placeholder lagi jika error
                     const p = imagePlaceholder.querySelector('p');
                     if(p) p.textContent = `Error: ${error.message}`;
                }
                if (generatedImage) generatedImage.style.display = 'none';
            } finally {
                generateImageButton.disabled = false;
                if (loadingIndicatorImage) loadingIndicatorImage.style.display = 'none';
            }
        });
    }
});