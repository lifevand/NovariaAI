// File: /api/generate.js
// Menggunakan model Gemini dengan systemInstruction untuk respons yang lebih dinamis.

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil data yang dikirim dari frontend
    const { userMessage, model } = req.body; // 'model' dari frontend mungkin tidak langsung digunakan untuk nama model API di sini

    if (!userMessage) { // Hanya userMessage yang wajib dari frontend untuk contoh ini
        return res.status(400).json({ message: 'Missing userMessage' });
    }

    // 3. Ambil API Key dari Environment Variables Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }
    
    // 4. Tentukan nama model API yang akan digunakan
    // PERHATIAN: Ganti 'gemini-2.0-flash-lite' dengan nama model yang valid jika perlu.
    // Contoh model yang valid: 'gemini-1.5-flash-latest' atau 'gemini-1.0-pro'
    const apiModelName = 'gemini-1.5-flash-latest'; // Menggunakan model yang diketahui mendukung systemInstruction

    // 5. Siapkan request ke API AI
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiModelName}:generateContent?key=${apiKey}`;
    
    const systemInstructionParts = [
        { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant." },
        { text: "When responding, if it feels natural and appropriate for the conversation, try to ask a follow-up question to better understand the user's needs or to encourage them to elaborate." },
        { text: "If the user seems to be facing a challenge or expressing uncertainty, try to offer a sense of encouragement or briefly suggest potential positive perspectives or general avenues they might consider exploring. Frame these as possibilities, not definitive solutions unless you are highly confident." },
        { text: "Maintain a friendly and supportive tone." }
    ];

    const requestBody = {
        contents: [{
            parts: [{ text: userMessage }]
            // Jika Anda ingin mengirim riwayat chat untuk konteks yang lebih baik:
            // role: "user", // atau "model"
        }],
        systemInstruction: {
            parts: systemInstructionParts
        },
        generationConfig: {
          temperature: 0.75, // Sedikit lebih kreatif tapi tetap berusaha on-point
          // topP: 0.95, // Contoh konfigurasi lain
          // topK: 40,   // Contoh konfigurasi lain
        },
        // safetySettings: [ // Opsional: Sesuaikan pengaturan keamanan jika perlu
        //   {
        //     category: "HARM_CATEGORY_HARASSMENT",
        //     threshold: "BLOCK_MEDIUM_AND_ABOVE"
        //   },
        //   // Tambahkan kategori lain jika diperlukan
        // ]
    };

    const requestHeaders = {
        'Content-Type': 'application/json',
    };

    // 6. Lakukan panggilan ke API AI
    try {
        const apiResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error(`API Error from ${apiModelName}:`, errorData);
            let errorMessage = `Error from ${apiModelName} API.`;
            if (errorData.error && errorData.error.message) {
                errorMessage += ` Message: ${errorData.error.message}`;
            }
            // Khusus untuk error model tidak ditemukan
            if (apiResponse.status === 404 && errorData.error?.message.toLowerCase().includes("model not found")) {
                errorMessage = `The specified AI model ('${apiModelName}') was not found. Please check the model name.`;
            } else if (apiResponse.status === 400 && errorData.error?.message.toLowerCase().includes("unsupported")) {
                 errorMessage = `The AI model ('${apiModelName}') may not support some features used (like systemInstruction). Error: ${errorData.error.message}`;
            }

            return res.status(apiResponse.status).json({ message: errorMessage });
        }

        const data = await apiResponse.json();

        // 7. Ekstrak teks jawaban dan kirim kembali ke frontend
        let responseText = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
            responseText = data.candidates[0].content.parts[0].text;
        } else {
            // Tangani kasus jika respons tidak memiliki teks karena diblokir oleh safety filter atau format tidak terduga
            if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
                if (data.candidates[0].finishReason === "SAFETY") {
                    responseText = "Maaf, saya tidak dapat memberikan respons untuk permintaan ini karena batasan keamanan.";
                } else if (data.candidates[0].finishReason === "RECITATION") {
                    responseText = "Respons diblokir karena terdeteksi sebagai kutipan dari sumber yang dilindungi.";
                } else if (data.candidates[0].finishReason === "OTHER") {
                     responseText = "Maaf, saya tidak dapat memproses permintaan Anda saat ini karena alasan yang tidak spesifik.";
                } else {
                    responseText = "Maaf, terjadi masalah saat menghasilkan respons (Reason: " + data.candidates[0].finishReason + ").";
                }
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                 responseText = "Permintaan Anda diblokir sebelum diproses oleh model (Reason: " + data.promptFeedback.blockReason + "). Harap sesuaikan permintaan Anda.";
            }
            else {
                console.error('Unexpected Gemini response structure:', data);
                throw new Error('Invalid response format from Gemini API. No text content found.');
            }
        }

        res.status(200).json({ text: responseText });

    } catch (error) {
        console.error('Internal Server Error in /api/generate:', error);
        res.status(500).json({ message: error.message || 'An internal server error occurred while contacting the AI model.' });
    }
          }
