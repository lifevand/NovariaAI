// login.js

// ... (jwt_decode, handleCredentialResponse, featureCardsData, renderFeatureCards - untuk fitur Novaria - tetap sama seperti versi sebelumnya)

// ===== DATA BARU UNTUK KARTU JELAJAHI AI LAIN =====
const exploreAiData = [
    // Anda akan menyiapkan path gambar di folder images/explore/
    // dan deskripsi singkat tapi detail.
    // Contoh gradien: ['#ff00ff', '#00ffff'] -> [warnaAwal, warnaAkhir]
    { name: "Monica.im", logo: "images/explore/monica.png", description: "Asisten AI serbaguna untuk browsing, menulis, dan berkreasi dengan dukungan GPT-4.", url: "https://monica.im/", gradient: ['#f0abfc', '#a855f7'] }, // Ungu-Pink
    { name: "Meta AI", logo: "images/explore/meta.png", description: "Model bahasa besar dari Meta, terintegrasi di berbagai platformnya.", url: "https://ai.meta.com/", gradient: ['#2563eb', '#3b82f6'] }, // Biru
    { name: "ChatGPT", logo: "images/explore/chatgpt.png", description: "Model AI percakapan revolusioner dari OpenAI, pionir dalam interaksi bahasa alami.", url: "https://chat.openai.com/", gradient: ['#10b981', '#6ee7b7'] }, // Hijau
    { name: "DeepSeek", logo: "images/explore/deepseek.png", description: "Platform AI yang fokus pada pencarian cerdas dan pemahaman kode.", url: "https://www.deepseek.com/", gradient: ['#f59e0b', '#fcd34d'] }, // Kuning-Oranye
    { name: "Qwen (Alibaba)", logo: "images/explore/qwen.png", description: "Seri model bahasa besar dari Alibaba Cloud, mendukung multimodalitas.", url: "https://qwenlm.aliyun.com/", gradient: ['#ef4444', '#f87171'] }, // Merah
    { name: "DeepAI", logo: "images/explore/deepai.png", description: "Menyediakan berbagai alat dan API AI untuk generasi gambar, teks, dan lainnya.", url: "https://deepai.org/", gradient: ['#6366f1', '#818cf8'] }, // Indigo
    { name: "Cohere", logo: "images/explore/cohere.png", description: "Platform AI untuk developer membangun aplikasi dengan LLM canggih.", url: "https://cohere.com/", gradient: ['#d946ef', '#e879f9'] }, // Fuchsia
    { name: "AI Studio (Google)", logo: "images/explore/aistudio.png", description: "Google AI Studio untuk eksplorasi dan pembuatan prototipe dengan model Gemini.", url: "https://aistudio.google.com/ Dulu MakerSuite", gradient: ['#0ea5e9', '#38bdf8'] }, // Sky Blue
    { name: "Microsoft AI", logo: "images/explore/microsoft.png", description: "Solusi dan platform AI komprehensif dari Microsoft Azure dan Bing.", url: "https://www.microsoft.com/ai", gradient: ['#14b8a6', '#5eead4'] }, // Teal
    { name: "Gemma (Google)", logo: "images/explore/gemma.png", description: "Keluarga model AI open-source ringan dan canggih dari Google DeepMind.", url: "https://ai.google.dev/gemma", gradient: ['#f472b6', '#fb7185'] }, // Rose
    { name: "Copilot (Microsoft)", logo: "images/explore/copilot.png", description: "Asisten AI dari Microsoft yang terintegrasi di berbagai produk untuk produktivitas.", url: "https://copilot.microsoft.com/", gradient: ['#06b6d4', '#22d3ee'] }, // Cyan
    { name: "Hugging Face", logo: "images/explore/huggingface.png", description: "Komunitas dan platform terdepan untuk model, dataset, dan alat AI open-source.", url: "https://huggingface.co/", gradient: ['#fbbf24', '#fde047'] }, // Amber
    { name: "Mistral AI", logo: "images/explore/mistral.png", description: "Pengembang model AI open-source berperforma tinggi dari Eropa.", url: "https://mistral.ai/", gradient: ['#a3a3a3', '#d4d4d4'] }, // Abu-abu terang
    { name: "Replicate", logo: "images/explore/replicate.png", description: "Jalankan model machine learning di cloud dengan API sederhana.", url: "https://replicate.com/", gradient: ['#4ade80', '#86efac'] }, // Hijau Limau
    { name: "Anthropic", logo: "images/explore/anthropic.png", description: "Perusahaan riset dan keamanan AI, pengembang model Claude.", url: "https://www.anthropic.com/", gradient: ['#f9a8d4', '#fda4af'] }, // Pink Muda
    { name: "Claude AI", logo: "images/explore/claude.png", description: "Asisten AI dari Anthropic yang fokus pada keamanan dan kemampuan membantu.", url: "https://claude.ai/", gradient: ['#c084fc', '#d8b4fe'] }, // Ungu Muda
    { name: "Gemini (Google)", logo: "images/explore/gemini.png", description: "Model AI multimodal paling canggih dari Google DeepMind.", url: "https://deepmind.google/technologies/gemini/", gradient: ['#3b82f6', '#60a5fa'] }  // Biru Google
];

function renderExploreAiCards() {
    const grid = document.getElementById('exploreAiGrid');
    if (!grid) return;

    grid.innerHTML = ''; // Kosongkan grid sebelum merender

    exploreAiData.forEach(item => {
        const cardElement = document.createElement('a'); // Buat sebagai link
        cardElement.className = 'explore-card';
        cardElement.href = item.url;
        cardElement.target = "_blank"; // Buka di tab baru
        cardElement.rel = "noopener noreferrer";

        // Efek border gradien dinamis
        const gradientBorderStyle = `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`;
        const buttonGradientStyle = `linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]})`;


        cardElement.innerHTML = `
            <div class="gradient-border-shine" style="background: ${gradientBorderStyle};"></div>
            <div class="explore-card-content">
                <div class="explore-card-header">
                    <img src="${item.logo}" alt="${item.name} Logo" class="explore-card-logo">
                    <h3>${item.name}</h3>
                </div>
                <div class="explore-card-divider"></div>
                <p class="explore-card-description">${item.description}</p>
                <span class="explore-card-button" style="background: ${buttonGradientStyle};">
                    Jelajahi ${item.name.split('.')[0]} <!-- Ambil nama sebelum .im/.ai jika ada -->
                </span>
            </div>
        `;
        grid.appendChild(cardElement);
    });
}

// Fungsi untuk auto-scroll (sederhana, bisa ditingkatkan)
// function autoScrollExploreGrid() {
//     const gridWrapper = document.querySelector('.horizontal-scroll-wrapper');
//     const grid = document.getElementById('exploreAiGrid');
//     if (!gridWrapper || !grid || grid.children.length === 0) return;

//     let scrollAmount = 0;
//     const scrollSpeed = 0.5; // Piksel per frame (sesuaikan)
//     let direction = 1;

//     function scroll() {
//         // Jika tidak dihover, scroll
//         if (!grid.matches(':hover')) {
//            scrollAmount += scrollSpeed * direction;
//            // Cek batas scroll
//            // Jika scroll ke kanan mentok, balik arah
//            if (scrollAmount >= (grid.scrollWidth - gridWrapper.clientWidth)) {
//                direction = -1;
//            }
//            // Jika scroll ke kiri mentok, balik arah
//            if (scrollAmount <= 0) {
//                direction = 1;
//            }
//            gridWrapper.scrollLeft = scrollAmount;
//         }
//         requestAnimationFrame(scroll);
//     }
//     // requestAnimationFrame(scroll); // Aktifkan jika ingin auto-scroll dengan JS
// }


window.onload = function () {
    // ... (kode onload untuk currentYearLogin, renderFeatureCards Novaria, Google Sign-In seperti sebelumnya) ...
    const currentYearSpanLogin = document.getElementById('currentYearLogin');
    if (currentYearSpanLogin) { /* ... */ }
    renderFeatureCards(); // Untuk fitur Novaria

    // Panggil fungsi render untuk kartu jelajah AI
    renderExploreAiCards();
    // autoScrollExploreGrid(); // Aktifkan jika ingin auto-scroll dengan JavaScript

    // ... (sisa kode inisialisasi Google Sign-In seperti sebelumnya) ...
    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    if (!clientIdMeta || !clientIdMeta.content) { /* ... */ return; }
    const clientId = clientIdMeta.content;
    try {
        google.accounts.id.initialize({ /* ... */ });
        const signInButtonContainer = document.getElementById('googleSignInButtonContainer');
        if (signInButtonContainer) {
             if (localStorage.getItem('isLoggedIn') !== 'true') {
                google.accounts.id.renderButton( signInButtonContainer, { /* ... text: "signin" ... */ });
            } else { /* ... tampilkan info user ... */ }
        }
    } catch (error) { /* ... */ }
};