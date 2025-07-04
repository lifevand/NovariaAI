// --- START OF FILE api/generate.js ---
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

async function searchImage(query) {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cx) {
        console.error("GOOGLE_SEARCH_API_KEY or GOOGLE_CSE_ID is not configured.");
        return null; 
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1`; 

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Google Search API error: ${response.status} - ${await response.text()}`);
            return null;
        }
        const data = await response.json();
        if (data.items && data.items.length > 0 && data.items[0].link) {
            return data.items[0].link;
        }
        return null;
    } catch (error) {
        console.error('Error fetching image from Google Search API:', error);
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { userMessage, conversationHistory, attachedFiles, selectedModel } = req.body;

    if (!userMessage) {
        return res.status(400).json({ message: 'Missing userMessage' });
    }

    const lowerCaseUserMessage = userMessage.toLowerCase();
    const sensitiveKeywords = [
        "kritik pemerintah indonesia", "kritik negara indonesia", "keburukan pemerintah indonesia",
        "sisi gelap indonesia", "masalah pemerintah indonesia", "kekurangan indonesia",
        "kejahatan pemerintah indonesia", "korupsi indonesia", "penindasan pemerintah indonesia",
        "pemerintahan indonesia buruk", "negara indonesia buruk", "aib indonesia",
        "skandal pemerintah", "jeleknya indonesia", "pemerintah korup", "indonesia bangkrut",
        "politik busuk", "pemerintah bobrok", "indonesia hancur", "negara gagal",
        "kejahatan pejabat"
    ];

    const isSensitiveRequest = sensitiveKeywords.some(keyword => lowerCaseUserMessage.includes(keyword));

    if (isSensitiveRequest) {
        return res.status(403).json({ 
            message: "Maaf, sebagai AI, saya diprogram untuk tetap netral dan tidak dapat memproses permintaan yang berkaitan dengan kritik atau hal negatif spesifik mengenai pemerintahan atau negara Indonesia. Fokus saya adalah memberikan informasi yang membantu, produktif, dan positif. Mohon ajukan pertanyaan lain." 
        });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const geminiModelName = selectedModel || 'gemini-2.5-flash'; 

    const tool = {
        functionDeclarations: [
            {
                name: "searchImage",
                description: "Mencari gambar di Google berdasarkan query yang diberikan. Gunakan ini ketika pengguna secara eksplisit meminta untuk mencari, menampilkan, atau menunjukkan gambar dari suatu objek, orang, tempat, atau konsep (misalnya: 'tampilkan gambar kucing', 'cari foto pemandangan', 'bisakah kamu menunjukkan gambar mobil Tesla').",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Kata kunci pencarian untuk gambar.",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    };

    const systemInstructionParts = [
        { text: "Anda adalah Novaria, asisten AI yang membantu, empatik, dan proaktif. Tujuan Anda adalah memberikan respons yang komprehensif, mendorong, dan sesuai konteks. Selalu pertimbangkan untuk menggunakan alat pencarian gambar jika pengguna meminta gambar atau visual." },
        { text: "Jangan gunakan format Markdown seperti bold (**), italic (*), atau bullet points (-) untuk teks biasa. Hanya gunakan blok kode (```) jika memang menampilkan contoh kode." }
    ];

    try {
        const geminiModel = genAI.getGenerativeModel({ 
            model: geminiModelName,
            tools: [tool],
            systemInstruction: { parts: systemInstructionParts }, 
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
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
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

        const functionCall = response.functionCall();
        if (functionCall && functionCall.name === "searchImage") {
            const imageUrl = await searchImage(functionCall.args.query);
            
            if (imageUrl) {
                const toolResponseResult = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: "searchImage",
                            response: { imageUrl: imageUrl, query: functionCall.args.query },
                        },
                    },
                ]);
                const toolResponse = await toolResponseResult.response;
                const aiResponseText = toolResponse.text();
                return res.status(200).json({ text: aiResponseText, imageUrl: imageUrl, modelUsed: geminiModelName });
            } else {
                const toolResponseResult = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: "searchImage",
                            response: { error: "Gambar tidak ditemukan atau terjadi masalah saat pencarian." },
                        },
                    },
                ]);
                const toolResponse = await toolResponseResult.response;
                const aiResponseText = toolResponse.text();
                return res.status(200).json({ 
                    text: aiResponseText || "Maaf, saya tidak dapat menemukan gambar tersebut. Bisakah Anda coba dengan deskripsi yang berbeda?", 
                    modelUsed: geminiModelName 
                });
            }
        }

        const aiResponseText = response.text();
        res.status(200).json({ text: aiResponseText, modelUsed: geminiModelName });

    } catch (error) {
        console.error('Error in /api/generate:', error);
        let errorMessage = 'Terjadi kesalahan internal server saat menghubungi model AI.';

        if (error.response) {
            let errorDetails;
            try {
                errorDetails = await error.response.json();
            } catch (jsonParseError) {
                errorDetails = await error.response.text();
                console.error("Respon error API bukan JSON:", errorDetails);
            }
            console.error('Detail Error API:', errorDetails);

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
                 errorMessage = `Model AI '${geminiModelName}' tidak ditemukan. Mohon periksa kembali nama model di backend Anda.`;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 400 && errorDetails.error.message.toLowerCase().includes("systeminstruction not supported")) {
                errorMessage = `Model '${geminiModelName}' mungkin tidak mendukung 'systemInstruction' atau 'tools'. Coba ganti model atau hapus konfigurasi ini.`;
            }
        } else {
            errorMessage = error.message || errorMessage;
        }
        res.status(error.response?.status || 500).json({ message: errorMessage });
    }
}
// --- END OF FILE api/generate.js ---