// File: /api/generate.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import 'dotenv/config'; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { userMessage, conversationHistory, attachedFiles } = req.body;

    if (!userMessage) {
        return res.status(400).json({ message: 'Missing userMessage' });
    }

    // --- BAGIAN BARU: FILTER KRITIK PEMERINTAH/NEGARA INDONESIA ---
    const lowerCaseUserMessage = userMessage.toLowerCase();

    // Daftar kata kunci atau frasa yang akan memicu pemblokiran.
    // Anda bisa menyesuaikannya sesuai kebutuhan dan seberapa ketat filternya.
    const sensitiveKeywords = [
        "kritik pemerintah indonesia",
        "kritik negara indonesia",
        "keburukan pemerintah indonesia",
        "sisi gelap indonesia",
        "masalah pemerintah indonesia",
        "kekurangan indonesia",
        "kejahatan pemerintah indonesia",
        "korupsi indonesia",
        "penindasan pemerintah indonesia",
        "pemerintahan indonesia buruk",
        "negara indonesia buruk",
        "aib indonesia",
        "skandal pemerintah",
        "jeleknya indonesia",
        // Tambahkan variasi lain yang mungkin digunakan pengguna
    ];

    // Cek apakah pesan pengguna mengandung salah satu kata kunci sensitif
    const isSensitiveRequest = sensitiveKeywords.some(keyword => lowerCaseUserMessage.includes(keyword));

    if (isSensitiveRequest) {
        // Kirim respons error kustom tanpa memanggil model AI
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

    const apiModelName = 'gemini-2.5-flash'; 

    const systemInstructionParts = [
        { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant. Your goal is to provide comprehensive and encouraging responses." },
        { text: "Do NOT use Markdown formatting for bolding (**), italicizing (*), or other inline styles. Use plain text for all responses unless explicitly generating code blocks." },
        { text: "When responding, if it feels natural and appropriate, try to ask a follow-up question or suggest potential next steps to better understand the user's needs or to encourage further interaction." },
        { text: "If the user seems to be facing a challenge or expressing uncertainty, offer a sense of encouragement or briefly suggest positive perspectives. Frame these as possibilities or general avenues." },
        { text: "Maintain a friendly and supportive tone." },
        { text: "For multimodal input (images), analyze the image and incorporate its context into your response." },
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
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
            ],
            generationConfig: {
              temperature: 0.8,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 2048,
            },
        });

        const result = await chat.sendMessage(currentUserMessageParts);
        const response = await result.response;
        const aiResponseText = response.text();

        res.status(200).json({ text: aiResponseText });

    } catch (error) {
        console.error('Error in /api/generate:', error);
        let errorMessage = 'An internal server error occurred while contacting the AI model.';

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
            }

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