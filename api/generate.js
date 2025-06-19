// /api/generate.js

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY tidak ditemukan di environment variables.");
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const safetySettings = [
    // ... (safety settings Anda) ...
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfigDefault = {
    // temperature: 0.9,
    // maxOutputTokens: 2048,
};

// Konfigurasi khusus untuk model image generation (jika diperlukan)
const generationConfigImage = {
    // temperature: 0.4, // Contoh: mungkin perlu setting berbeda untuk image gen
    // responseMimeType: "application/json", // Jika model mengembalikan JSON dengan link gambar
};


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const { userMessage, model: modelIdFromFrontend, fileDetails } = req.body;

        if (!userMessage && (!fileDetails || fileDetails.length === 0)) {
            return res.status(400).json({ message: "Pesan pengguna atau detail file tidak boleh kosong." });
        }

        if (!modelIdFromFrontend) {
            return res.status(400).json({ message: "ID Model tidak disertakan." });
        }

        // `modelIdFromFrontend` sekarang adalah nama model API yang valid (misalnya, 'gemini-2.0-flash-lite')
        const actualModelApiName = modelIdFromFrontend;

        console.log(`[Vercel Function] Akan menggunakan model API: ${actualModelApiName} untuk pesan: "${userMessage || 'Analisis File'}"`);

        // Pilih konfigurasi generasi berdasarkan model
        let currentGenerationConfig = generationConfigDefault;
        if (actualModelApiName.includes('image-generation')) { // Cek apakah ini model image gen
            currentGenerationConfig = { ...generationConfigDefault, ...generationConfigImage };
            // Anda mungkin perlu memformat prompt secara berbeda untuk image generation
            // prompt = `Generate an image: ${userMessage}`; // Contoh
        }

        const model = genAI.getGenerativeModel({
            model: actualModelApiName,
            safetySettings,
            generationConfig: currentGenerationConfig, // Gunakan config yang sesuai
        });

        let prompt = userMessage;
        if (fileDetails && fileDetails.length > 0) {
            const fileNames = fileDetails.map(f => f.name).join(', ');
            if (prompt) {
                prompt += ` (Dengan file terlampir: ${fileNames}. Harap pertimbangkan file ini dalam respons Anda jika relevan.)`;
            } else {
                prompt = `Harap analisis file-file berikut: ${fileNames}.`;
            }
        }
        
        // Logika Khusus untuk Image Generation
        // Model image generation mungkin memiliki cara kerja berbeda (misalnya, mengembalikan URL gambar atau data base64)
        // dan mungkin tidak selalu mengembalikan `.text()`.
        // Kode di bawah ini adalah untuk model teks. Anda perlu menyesuaikannya jika `gemini-imagen-gen`
        // adalah model yang menghasilkan gambar dan bukan teks deskriptif.

        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            // ... (penanganan respons diblokir seperti sebelumnya) ...
            let blockReason = "Tidak diketahui";
            if (response.promptFeedback && response.promptFeedback.blockReason) {
                blockReason = response.promptFeedback.blockReason;
            } else if (response.candidates && response.candidates[0] && response.candidates[0].finishReason === 'SAFETY') {
                blockReason = "Konten diblokir karena alasan keamanan (SAFETY)";
            }
             console.warn(`[Vercel Function] Respons diblokir atau kosong. Block reason: ${blockReason}`, response.promptFeedback);
            return res.status(400).json({ message: `Respons dari AI diblokir karena alasan keamanan: ${blockReason}. Silakan ubah prompt Anda.` });
        }

        // Jika model image-generation mengembalikan struktur berbeda (misalnya, JSON dengan URL gambar)
        if (actualModelApiName.includes('image-generation')) {
            // Asumsi model mengembalikan JSON dengan path ke gambar atau data base64
            // Ini HANYA CONTOH, Anda perlu menyesuaikan berdasarkan output aktual model image gen
            // const imageData = response.candidates[0].content.parts[0]; // Bisa jadi berbeda
            // if (imageData.fileData) { // Contoh jika mengembalikan FileData
            //    return res.status(200).json({ image_url: `data:${imageData.mimeType};base64,${imageData.fileData.data}` });
            // } else {
            //    return res.status(200).json({ text: "Menerima respons dari model gambar, tetapi format tidak dikenali." });
            // }
            // Untuk saat ini, kita anggap semua mengembalikan teks untuk konsistensi,
            // Anda perlu logika khusus jika `gemini-imagen-gen` menghasilkan gambar
            const text = response.text();
            return res.status(200).json({ text: `(Respons dari ${actualModelApiName}): ${text}` });

        } else {
            const text = response.text();
            return res.status(200).json({ text });
        }

    } catch (error) {
        // ... (error handling seperti sebelumnya) ...
        console.error("[Vercel Function] Error di /api/generate:", error);
        let errorMessage = "Terjadi kesalahan internal pada server saat memproses permintaan Anda.";
        // ... (detail error handling) ...
        if (error.message) {
            if (error.message.includes("API key not valid") || error.message.includes("PERMISSION_DENIED")) {
                errorMessage = "Terjadi masalah dengan otorisasi API. Silakan hubungi administrator.";
            } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
                errorMessage = "Batas penggunaan API telah tercapai. Silakan coba lagi nanti.";
            } else if (error.message.includes("model") && error.message.includes("not found")) {
                errorMessage = `Model AI "${modelIdFromFrontend}" tidak ditemukan atau tidak valid. Pastikan ID model benar dan didukung. Error: ${error.message}`;
            } else {
                errorMessage = error.message;
            }
        }
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error.message;
        }
        if (error.message.toLowerCase().includes("api key") && error.message.toLowerCase().includes("must be a valid string")) {
             errorMessage = "API Key tidak valid atau tidak ditemukan. Pastikan sudah dikonfigurasi dengan benar.";
        }
        return res.status(500).json({ message: errorMessage });
    }
}