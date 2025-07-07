// File: /api/generate.js

// Hapus HarmCategory dari import karena kita akan menggunakan string literal
import { GoogleGenerativeAI, HarmBlockThreshold } from '@google/generative-ai';
import 'dotenv/config'; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { userMessage, conversationHistory, attachedFiles, selectedModel } = req.body; // Ambil selectedModel dari frontend

    if (!userMessage && attachedFiles.length === 0) { // Ubah agar bisa kirim hanya file
        return res.status(400).json({ message: 'User message or attached file is required.' });
    }

    // --- BAGIAN BARU: FILTER KRITIK PEMERINTAH/NEGARA INDONESIA ---
    const lowerCaseUserMessage = userMessage.toLowerCase();

    const sensitiveKeywords = [
        "kritik pemerintah indonesia", "kritik negara indonesia", "keburukan pemerintah indonesia",
        "sisi gelap indonesia", "masalah pemerintah indonesia", "kekurangan indonesia",
        "kejahatan pemerintah indonesia", "korupsi indonesia", "penindasan pemerintah indonesia",
        "pemerintahan indonesia buruk", "negara indonesia buruk", "aib indonesia",
        "skandal pemerintah", "jeleknya indonesia", "pemerintah korup", "indonesia rusak",
        "penipuan pemerintah", "pemilu curang", "demo pemerintah", "kebijakan zalim",
        "negara bangkrut", "kemiskinan di indonesia", "pengangguran di indonesia",
        "utang negara", "kriminalitas di indonesia", "teroris di indonesia",
        "perang saudara", "kekerasan militer", "otoriter indonesia", "diktator indonesia",
        "ancaman teroris", "konflik agama", "separatisme", "diskriminasi etnis",
        "pelanggaran ham", "genosida", "kudeta", "revolusi", "pemberontakan",
        "kejahatan perang", "pembersihan etnis", "pembantaian", "penindasan sipil",
        "militer brutal", "polisi kejam", "intelijen jahat", "rahasia negara",
        "konspirasi pemerintah", "kebohongan pemerintah", "propaganda pemerintah",
        "sensor pemerintah", "hak asasi manusia", "penjara politik", "penyiksaan",
        "penculikan", "pembunuhan massal", "apartheid", "totaliter", "fasisme",
        "komunisme", "anarki", "terorisme", "ekstremisme", "radikalisme",
        // Tambahkan variasi lain yang mungkin digunakan pengguna
    ];

    const isSensitiveRequest = sensitiveKeywords.some(keyword => lowerCaseUserMessage.includes(keyword));

    if (isSensitiveRequest) {
        return res.status(403).json({ 
            message: "Maaf, sebagai AI, saya diprogram untuk tetap netral dan tidak dapat memproses permintaan yang berkaitan dengan kritik atau hal negatif spesifik mengenai pemerintahan atau negara Indonesia. Fokus saya adalah memberikan informasi yang membantu, produktif, dan positif. Mohon ajukan pertanyaan lain." 
        });
    }
    // --- AKHIR BAGIAN BARU ---


    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ======================================================================
    // MODIFIKASI PENTING: Penentuan Model Berdasarkan selectedModel dari Frontend
    // Sesuaikan ini dengan MODELS_CONFIG dari script.js frontend Anda
    // selectedModel akan berisi 'gemini-2.5-flash', 'gemini-2.0-flash', atau 'gemini-1.5-flash'
    const MODELS_CONFIG_BACKEND = {
        'gemini-2.5-flash': { // Ini adalah nama yang dikirim dari frontend
            model: 'gemini-2.5-flash', // Nama model yang sebenarnya di API Gemini
            temperature: 0.1,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
        },
        'gemini-2.0-flash': { // Nama yang dikirim dari frontend untuk Smart
            model: 'gemini-2.0-flash', // Nama model yang sebenarnya di API Gemini
            temperature: 0.5,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
        },
        'gemini-1.5-flash': { // Nama yang dikirim dari frontend untuk Other (jika ada)
            model: 'gemini-1.5-flash', // Contoh, bisa ganti ke model lain jika perlu
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
        },
        // Model default jika 'selectedModel' tidak cocok dengan yang di atas
        'default': {
            model: 'gemini-1.5-flash',
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
        }
    };

    const currentModelConfig = MODELS_CONFIG_BACKEND[selectedModel] || MODELS_CONFIG_BACKEND.default;
    const apiModelName = currentModelConfig.model; // Gunakan nama model yang sesuai dari config
    // ======================================================================


    // ======================================================================
    // MODIFIKASI PENTING: Safety Settings dengan String Literal
    // Hapus instruksi untuk TIDAK menggunakan Markdown jika Anda ingin code block tetap muncul
    const systemInstructionParts = [
        { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant. Your goal is to provide comprehensive and encouraging responses." },
        // { text: "Do NOT use Markdown formatting for bolding (**), italicizing (*), or other inline styles. Use plain text for all responses unless explicitly generating code blocks." }, // <= Hapus atau komentar baris ini
        { text: "When responding, if it feels natural and appropriate, try to ask a follow-up question or suggest potential next steps to better understand the user's needs or to encourage further interaction." },
        { text: "If the user seems to be facing a challenge or expressing uncertainty, offer a sense of encouragement or briefly suggest positive perspectives. Frame these as possibilities or general avenues." },
        { text: "Maintain a friendly and supportive tone." },
        { text: "For multimodal input (images), analyze the image and incorporate its context into your response." },
    ];
    // ======================================================================

    try {
        const geminiModel = genAI.getGenerativeModel({
            model: apiModelName,
            // GenerativeConfig dan SafetySettings dipindahkan ke dalam startChat
            // agar bisa digabungkan dengan history dan systemInstruction
            // Namun, bisa juga di sini jika tidak ingin ada yang spesifik ke chat
        });

        const historyForGemini = (conversationHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const currentUserMessageParts = [{ text: userMessage }];

        if (attachedFiles && attachedFiles.length > 0) {
            for (const file of attachedFiles) {
                if (file.data && file.mimeType) {
                    currentUserMessageParts.push({
                        inlineData: {
                            data: file.data, 
                            mimeType: file.mimeType 
                        }
                    });
                } else {
                    console.warn('Skipping invalid attached file data:', file);
                }
            }
        }

        const chat = geminiModel.startChat({
            history: historyForGemini,
            systemInstruction: { parts: systemInstructionParts }, 
            safetySettings: [
                // ======================================================================
                // KOREKSI PENTING: Ganti HarmCategory.HARM_CATEGORY_... menjadi STRING LITERAL
                { category: "HARM_CATEGORY_HARASSMENT", threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: HarmBlockThreshold.BLOCK_NONE },
                // ======================================================================
            ],
            generationConfig: {
              temperature: currentModelConfig.temperature, // Ambil dari config model yang dipilih
              topP: currentModelConfig.topP,              // Ambil dari config model yang dipilih
              topK: currentModelConfig.topK,              // Ambil dari config model yang dipilih
              maxOutputTokens: currentModelConfig.maxOutputTokens, // Ambil dari config model yang dipilih
            },
        });

        const result = await chat.sendMessage(currentUserMessageParts);
        const response = await result.response;
        const aiResponseText = response.text();

        res.status(200).json({
            text: aiResponseText,
            modelUsed: selectedModel // Kirim kembali nama model yang dikirim dari frontend
        });

    } catch (error) {
        console.error('Error in /api/generate:', error);
        let errorMessage = 'An internal server error occurred while contacting the AI model.';
        let statusCode = 500;

        if (error.response) {
            let errorDetails;
            try {
                errorDetails = await error.response.json();
            } catch (jsonParseError) {
                errorDetails = await error.response.text();
                console.error("API error response was not JSON:", errorDetails);
            }
            console.error('API Error Details:', errorDetails);

            if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.message) {
                errorMessage = errorDetails.error.message;
                statusCode = errorDetails.error.code || 500;
            }

            if (typeof errorDetails === 'object' && errorDetails.candidates && errorDetails.candidates[0] && errorDetails.candidates[0].finishReason) {
                const finishReason = errorDetails.candidates[0].finishReason;
                if (finishReason === "SAFETY") {
                    errorMessage = "Maaf, respons ini diblokir karena tidak memenuhi pedoman keamanan.";
                    statusCode = 403; // Forbidden
                } else if (finishReason === "RECITATION") {
                    errorMessage = "Respons diblokir karena terdeteksi sebagai kutipan dari sumber yang dilindungi.";
                    statusCode = 403;
                } else if (finishReason === "OTHER") {
                    errorMessage = "Maaf, terjadi masalah saat menghasilkan respons karena alasan yang tidak spesifik.";
                }
            } else if (typeof errorDetails === 'object' && errorDetails.promptFeedback && errorDetails.promptFeedback.blockReason) {
                errorMessage = "Permintaan Anda diblokir sebelum diproses oleh model karena alasan keamanan. Harap sesuaikan permintaan Anda.";
                statusCode = 403;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 404 && errorDetails.error.message.toLowerCase().includes("model not found")) {
                 errorMessage = `Model AI '${apiModelName}' (${selectedModel} dari frontend) tidak ditemukan di Gemini API. Mohon periksa kembali nama model di backend Anda.`;
                 statusCode = 404;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 400 && errorDetails.error.message.toLowerCase().includes("systeminstruction not supported")) {
                errorMessage = `Model '${apiModelName}' (${selectedModel} dari frontend) mungkin tidak mendukung 'systemInstruction'. Coba ganti model atau hapus systemInstruction.`;
                statusCode = 400;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 429) {
                errorMessage = "Maaf, kuota permintaan API telah habis atau terlalu banyak permintaan. Silakan coba lagi nanti.";
                statusCode = 429;
            }
        } else {
            errorMessage = error.message || errorMessage;
        }
        res.status(statusCode).json({ message: errorMessage });
    }
}
