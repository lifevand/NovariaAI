// File: /api/generate.js
// Menggunakan model Gemini dengan systemInstruction untuk respons yang lebih dinamis.
// Penanganan riwayat percakapan dan input multi-modal (gambar).

// Ganti require menjadi import
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// Untuk dotenv, gunakan import ini untuk memuat variabel lingkungan di ES module
import 'dotenv/config'; 

// Export default function seperti yang sudah ada, ini sudah ES Module syntax
export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil data yang dikirim dari frontend
    const { userMessage, conversationHistory, attachedFiles } = req.body;

    if (!userMessage) {
        return res.status(400).json({ message: 'Missing userMessage' });
    }

    // 3. Ambil API Key dari Environment Variables Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 4. Tentukan nama model API yang akan digunakan
    // MENGGUNAKAN 'gemini-2.5-flash' sesuai informasi Anda,
    // TETAPI saya mempertahankan 'gemini-1.5-flash-latest' sebagai fallback/rekomendasi stabil.
    // GANTI NAMA MODEL DI BAWAH INI SESUAI DENGAN YANG ANDA LIHAT DI GOOGLE AI STUDIO (misalnya 'gemini-2.5-flash')
    const apiModelName = 'gemini-2.5-flash'; 
    // const apiModelName = 'gemini-2.5-flash'; // Coba gunakan ini jika Anda yakin namanya persis dan sudah tersedia untuk API Anda.

    // === System Instruction untuk AI Novaria ===
    const systemInstructionParts = [
        { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant. Your goal is to provide comprehensive and encouraging responses." },
        { text: "Do NOT use Markdown formatting for bolding (**), italicizing (*), or other inline styles. Use plain text for all responses unless explicitly generating code blocks." },
        { text: "When responding, if it feels natural and appropriate, try to ask a follow-up question or suggest potential next steps to better understand the user's needs or to encourage further interaction." },
        { text: "If the user seems to be facing a challenge or expressing uncertainty, offer a sense of encouragement or briefly suggest positive perspectives. Frame these as possibilities or general avenues." },
        { text: "Maintain a friendly and supportive tone." },
        { text: "For multimodal input (images), analyze the image and incorporate its context into your response." }
        { text: "give an error message when someone asks for criticism of the Indonesian government or provides bad facts about the Indonesian state." },
      ];

    try {
        const geminiModel = genAI.getGenerativeModel({ model: apiModelName });

        // === 5. Persiapkan Riwayat Percakapan untuk Model AI ===
        // Memastikan riwayat adalah array, jika tidak, inisialisasi kosong
        const historyForGemini = (conversationHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // === 6. Persiapkan Pesan User Saat Ini (termasuk file jika ada) ===
        const currentUserMessageParts = [{ text: userMessage }];

        if (attachedFiles && attachedFiles.length > 0) {
            for (const file of attachedFiles) {
                // Pastikan file memiliki data dan mimeType yang valid
                if (file.data && file.mimeType) {
                    currentUserMessageParts.push({
                        inlineData: {
                            data: file.data, // Data Base64 dari frontend
                            mimeType: file.mimeType // MIME type dari frontend
                        }
                    });
                } else {
                    console.warn('Skipping invalid attached file data:', file);
                }
            }
        }

        // === 7. Buat Chat Session dengan History dan System Instruction ===
        const chat = geminiModel.startChat({
            history: historyForGemini,
            systemInstruction: { parts: systemInstructionParts }, // Terapkan system instruction
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, // Sesuaikan ini sesuai kebijakan Anda
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE, // Sesuaikan
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, // Sesuaikan
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, // Sesuaikan
                },
            ],
            generationConfig: {
              temperature: 0.8, // Sedikit lebih kreatif dan bervariasi
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 2048, // Batasi panjang respons jika perlu
            },
        });

        // === 8. Kirim Pesan ke Model AI ===
        const result = await chat.sendMessage(currentUserMessageParts);
        const response = await result.response;
        const aiResponseText = response.text();

        res.status(200).json({ text: aiResponseText });

    } catch (error) {
        console.error('Error in /api/generate:', error);
        let errorMessage = 'An internal server error occurred while contacting the AI model.';

        // Periksa apakah error memiliki respons dari API (misalnya dari Google Gemini API)
        if (error.response) {
            // Coba parse respons error sebagai JSON jika ada metode .json()
            let errorDetails;
            try {
                errorDetails = await error.response.json();
            } catch (jsonParseError) {
                // Jika tidak bisa di-parse sebagai JSON, ambil sebagai teks mentah
                errorDetails = await error.response.text();
                console.error("API error response was not JSON:", errorDetails);
            }
            console.error('API Error Details:', errorDetails);

            if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.message) {
                errorMessage = errorDetails.error.message;
            }

            // Penanganan spesifik untuk finishReason dari Gemini API
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
            // Error network atau error lainnya yang tidak dari API respons
            errorMessage = error.message || errorMessage;
        }

        // Gunakan status dari error.response jika ada, kalau tidak default ke 500
        res.status(error.response?.status || 500).json({ message: errorMessage });
    }
            }
