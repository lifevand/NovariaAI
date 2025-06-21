// Di dalam fungsi generateRealAIResponse di script.js (untuk index.html)

// ... sebelum blok try ...
if (thinkingIndicator) {
    thinkingIndicator.classList.remove('hidden');
    thinkingIndicator.style.opacity = '1';
}
// ...

try {
    const response = await fetch('/api/generate', {
        // ... (method, headers, body seperti sebelumnya) ...
    });

    const data = await response.json(); // Selalu coba parse JSON

    if (!response.ok) {
        // TAMBAHAN: Cek jika ini error karena model loading dari backend Hugging Face
        if (data && data.errorType === 'model_loading') {
            // Anda bisa menambahkan UI khusus di sini, atau mekanisme retry
            // Untuk sekarang, kita tampilkan saja pesannya
            const estimatedTime = data.estimated_time ? ` Perkiraan waktu: ${data.estimated_time} detik.` : '';
            addChatMessage(`<span>Maaf, model AI sedang disiapkan.${estimatedTime} Silakan coba beberapa saat lagi.</span>`, 'ai');
        } else {
            // Error lain
            addChatMessage(`<span>Maaf, terjadi kesalahan: ${data.message || `Server error (${response.status})`}. Silakan coba lagi.</span>`, 'ai');
        }
        // Sembunyikan thinking indicator jika error
        if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
        setTimeout(() => { if (thinkingIndicator) thinkingIndicator.classList.add('hidden'); }, 300);
        return; // Hentikan eksekusi jika error
    }

    // Jika sukses (response.ok)
    const rawAiResponseText = data.text;

    if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
    setTimeout(() => {
        if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
        // ... (sisa logika personalisasi dan rendering respons seperti sebelumnya) ...
        // ... (addChatMessage(finalHtmlContent, 'ai');) ...
        // ... (addAiMessageActions(aiMessageElement);) ...
    }, 300);

} catch (error) {
    console.error('Error fetching from /api/generate:', error);
    if (thinkingIndicator) thinkingIndicator.style.opacity = '0';
    setTimeout(() => {
        if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
        const errorMessage = `<span>Maaf, terjadi masalah koneksi: ${error.message}. Silakan coba lagi.</span>`;
        addChatMessage(errorMessage, 'ai');
    }, 300);
                }
