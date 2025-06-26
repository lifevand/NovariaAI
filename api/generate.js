// File: /api/generate.js
// ... (import dan setup dotenv, GoogleGenerativeAI)

export default async function handler(req, res) {
    // ... (kode pengecekan method, ambil userMessage, history, files)

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // GANTI NAMA MODEL DI SINI
    // Pilihan:
    // 1. 'gemini-2.0-flash-preview-image-generation' (jika Anda yakin tersedia API-nya dan stabil)
    // 2. 'gemini-1.5-pro-latest' (lebih stabil dan pasti mendukung output multimodal)
    // 3. 'gemini-1.5-flash-latest' (lebih cepat dan murah, juga mendukung output multimodal)
    const apiModelName = 'gemini-2.0-flash-preview-image-generation'; // <-- Contoh model yang pasti bisa multimodal output

    const systemInstructionParts = [
        // ... (system instruction Anda yang sudah ada)
        { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant. Your goal is to provide comprehensive and encouraging responses." },
        { text: "Do NOT use Markdown formatting for bolding (**), italicizing (*), or other inline styles. Use plain text for all responses unless explicitly generating code blocks." },
        { text: "When responding, if it feels natural and appropriate, try to ask a follow-up question or suggest potential next steps to better understand the user's needs or to encourage further interaction." },
        { text: "If the user seems to be facing a challenge or expressing uncertainty, offer a sense of encouragement or briefly suggest positive perspectives. Frame these as possibilities or general avenues." },
        { text: "Maintain a friendly and supportive tone." },
        { text: "For multimodal input (images), analyze the image and incorporate its context into your response." },
        // TAMBAHAN: Instruksi agar AI tahu ia bisa MENGHASILKAN gambar
        { text: "If the user's prompt clearly indicates a request for an image (e.g., 'generate an image of...', 'show me a picture of...', 'draw a...', 'create an image based on...') and you understand the visual concept, you MAY generate an image alongside your text response." },
        { text: "If you generate an image, also provide a brief text explanation about the image. If you cannot generate an image or it's not appropriate, just provide a text response." }
    ];

    try {
        const geminiModel = genAI.getGenerativeModel({ model: apiModelName });

        const historyForGemini = (conversationHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const currentUserMessageParts = [{ text: userMessage }];
        if (attachedFiles && attachedFiles.length > 0) {
            for (const file of attachedFiles) {
                if (file.data && file.mimeType) {
                    currentUserMessageParts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
                }
            }
        }

        const chat = geminiModel.startChat({
            history: historyForGemini,
            systemInstruction: { parts: systemInstructionParts },
            safetySettings: [/* ... */],
            generationConfig: {
              temperature: 0.8,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 2048,
              responseMimeType: "text/plain", // Ini untuk teks utama, tapi gambar tetap bisa datang
              // PENTING: tambahkan response_modalities
              responseMimeType: "text/plain", // Ini instruksi untuk teks biasa. Gambar tetap akan datang sebagai inlineData.
              response_modalities: ["IMAGE", "TEXT"], // <-- TAMBAHKAN INI
            },
        });

        const result = await chat.sendMessage(currentUserMessageParts); // <-- Masih pakai sendMessage biasa (non-streaming)
        const response = await result.response;

        // --- Perubahan Besar di Sini: Memproses Parts Respons ---
        const generatedContent = {
            text: '',
            imageUrl: null, // Akan menyimpan URL Base64 gambar
            imageMimeType: null
        };

        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    generatedContent.text += part.text; // Akumulasi semua bagian teks
                } else if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
                    // Jika ada data gambar, simpan Base64-nya
                    generatedContent.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    generatedContent.imageMimeType = part.inlineData.mimeType;
                }
            }
        } else {
             // Tangani kasus jika respons tidak memiliki konten atau diblokir
            if (response.candidates && response.candidates[0] && response.candidates[0].finishReason) {
                if (response.candidates[0].finishReason === "SAFETY") {
                    generatedContent.text = "Maaf, saya tidak dapat memberikan respons untuk permintaan ini karena batasan keamanan.";
                } else if (response.candidates[0].finishReason === "RECITATION") {
                    generatedContent.text = "Respons diblokir karena terdeteksi sebagai kutipan dari sumber yang dilindungi.";
                } else if (response.candidates[0].finishReason === "OTHER") {
                    generatedContent.text = "Maaf, terjadi masalah saat menghasilkan respons karena alasan yang tidak spesifik.";
                } else {
                    generatedContent.text = "Maaf, terjadi masalah saat menghasilkan respons (Reason: " + response.candidates[0].finishReason + ").";
                }
            } else if (response.promptFeedback && response.promptFeedback.blockReason) {
                 generatedContent.text = "Permintaan Anda diblokir sebelum diproses oleh model (Reason: " + response.promptFeedback.blockReason + "). Harap sesuaikan permintaan Anda.";
            } else {
                console.error('Unexpected Gemini response structure:', response);
                throw new Error('Invalid response format from Gemini API. No text or image content found.');
            }
        }

        // Kirim objek yang berisi teks dan URL gambar (jika ada)
        res.status(200).json(generatedContent);

    } catch (error) {
        // ... (error handling yang sudah ada, perlu sedikit disesuaikan untuk response.json() vs response.text())
        console.error('Error in /api/generate:', error);
        let errorMessage = 'An internal server error occurred while contacting the AI model.';

        if (error.response) {
            let errorDetails;
            try {
                errorDetails = await error.response.json();
            } catch (jsonParseError) {
                errorDetails = await error.response.text();
            }
            console.error('API Error Details:', errorDetails);

            if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.message) {
                errorMessage = errorDetails.error.message;
            } else if (typeof errorDetails === 'string' && errorDetails.length > 0) {
                 errorMessage = `API Error: ${errorDetails.substring(0, 100)}`; // Ambil sebagian kecil dari teks error
            }

            // Penanganan spesifik untuk finishReason dari Gemini API (ini masih relevan)
            if (typeof errorDetails === 'object' && errorDetails.candidates && errorDetails.candidates[0] && errorDetails.candidates[0].finishReason) {
                const finishReason = errorDetails.candidates[0].finishReason;
                if (finishReason === "SAFETY") {
                    errorMessage = "Maaf, respons ini diblokir karena tidak memenuhi pedoman keamanan.";
                } else if (finishReason === "RECITATION") {
                    errorMessage = "Respons diblokir karena terdeteksi sebagai kutipan dari sumber yang dilindungi.";
                } else if (finishReason === "OTHER") {
                    errorMessage = "Maaf, terjadi masalah saat menghasilkan respons karena alasan yang tidak spesifik.";
                }
            } else if (typeof errorDetails === 'object' && errorDetails.promptFeedback && errorDetails.promptFeedback.blockReason) {
                errorMessage = "Permintaan Anda diblokir sebelum diproses oleh model karena alasan keamanan. Harap sesuaikan permintaan Anda.";
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 404 && errorDetails.error.message.toLowerCase().includes("model not found")) {
                 errorMessage = `Model AI '${apiModelName}' tidak ditemukan. Mohon periksa kembali nama model di backend Anda.`;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 400 && errorDetails.error.message.toLowerCase().includes("systeminstruction not supported")) {
                errorMessage = `Model '${apiModelName}' mungkin tidak mendukung 'systemInstruction'. Coba ganti model atau hapus systemInstruction.`;
            }
        } else {
            errorMessage = error.message || errorMessage;
        }

        res.status(error.response?.status || 500).json({ message: errorMessage });
    }
                                                 }
