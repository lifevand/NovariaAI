// File: /api/generate.js
// Menggunakan model Gemini dengan systemInstruction untuk respons yang lebih dinamis
// dan memproses histori chat dari frontend untuk konteks.

import fetch from 'node-fetch'; // Import fetch jika Anda menggunakan Node.js atau lingkungan Vercel/Netlify Edge Functions

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil data yang dikirim dari frontend
    // Frontend sekarang mengirim array 'messages' (histori + pesan baru)
    // dan array opsional 'fileDetails' (metadata file untuk pesan terbaru)
    const { messages, fileDetails, model } = req.body;

    // Validasi dasar: Pastikan 'messages' adalah array dan tidak kosong
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty "messages" array in request body.' });
    }

    // 3. Ambil API Key dari Environment Variables Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not configured.");
        return res.status(500).json({ message: 'Server configuration error: GEMINI_API_KEY is not set.' });
    }

    // 4. Tentukan nama model API yang akan digunakan
    // Gunakan model chat yang mendukung multi-turn conversation dan systemInstruction
    // 'gemini-1.5-flash-latest' direkomendasikan untuk chat history
    // 'gemini-1.0-pro' juga bisa, tapi 1.5-flash lebih murah dan cepat
    const apiModelName = 'gemini-1.5-flash-latest';

    // 5. Siapkan request body untuk Gemini API
    // Konversi format messages dari frontend [{sender: 'user'/'ai', content: '...'}]
    // ke format 'contents' Gemini API [{ role: 'user'/'model', parts: [{ text: '...' }, ...] }]

    const geminiContents = messages.map(msg => {
        // Map sender 'user' ke role 'user', dan 'ai' ke role 'model'
        const role = msg.sender === 'user' ? 'user' : 'model';

        // Untuk kesederhanaan, kita asumsikan 'content' adalah teks.
        // Jika frontend mengirim HTML hasil render markdown, Anda mungkin perlu
        // membersihkan tag HTML atau mengirim versi teks mentahnya dari frontend.
        // Untuk chat history, Gemini API umumnya mengharapkan teks biasa.
        // Kita akan mengirim teks mentah yang disimpan di 'content' array frontend.
        let parts = [{ text: msg.content }];

        // Cek apakah ini pesan terakhir (yang dikirim user baru saja)
        // dan apakah ada file yang dilampirkan (metadata)
        // PENTING: Backend ini hanya menerima METADATA file dari frontend.
        // Untuk mengirim file CONTENT ke Gemini (multimodal), frontend harus
        // membaca file (misal: Base64) dan mengirim DATA file ke backend.
        // Backend kemudian harus memformat data ini sebagai part 'inlineData'.
        // Modifikasi di bawah ini hanya placeholder untuk menunjukkan di mana
        // logic untuk file content perlu ditambahkan jika frontend mengirimkannya.
        if (msg === messages[messages.length - 1] && fileDetails && fileDetails.length > 0) {
             // Jika file content (misal: base64) disertakan di pesan terakhir dari frontend:
             // Contoh struktur jika frontend mengirim:
             // { sender: 'user', content: 'Teks pesan', fileData: [{ mimeType: '...', data: '...' }] }
             // Maka parts akan menjadi: [{ text: msg.content }, { inlineData: msg.fileData[0] }, ...]
             // SAAT INI frontend TIDAK mengirim fileData, jadi bagian ini hanya contoh konseptual.
             console.warn("Received fileDetails metadata, but the current backend does not support sending file content to Gemini API. File data must be sent from the frontend.");
             // parts.push({ text: `(Files attached: ${fileDetails.map(f => f.name).join(', ')})` }); // Opsional: Tambahkan info file ke teks prompt
             // Jika Anda mengimplementasikan pengiriman data file dari frontend:
             // parts.push(...msg.fileData.map(f => ({ inlineData: { mimeType: f.mimeType, data: f.data } })));
        }


        return {
            role: role,
            parts: parts // Menggunakan parts yang sudah disiapkan
        };
    });

    const requestBody = {
        contents: geminiContents, // Kirim array contents yang sudah diformat
        systemInstruction: { // systemInstruction di luar array contents (untuk model yang mendukung)
            parts: systemInstructionParts // systemInstruction diambil dari definisi di bawah
        },
        generationConfig: {
          temperature: 0.75,
        },
        // safetySettings: [ ... ] // Opsional: Sesuaikan pengaturan keamanan
    };

     // Definisi systemInstructionParts (diletakkan di sini atau di scope yang bisa diakses)
     const systemInstructionParts = [
         { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant." },
         { text: "When responding, if it feels natural and appropriate for the conversation, try to ask a follow-up question to better understand the user's needs or to encourage them to elaborate." },
         { text: "If the user seems to be facing a challenge or expressing uncertainty, try to offer a sense of encouragement or briefly suggest potential positive perspectives or general avenues they might consider exploring. Frame these as possibilities, not definitive solutions unless you are highly confident." },
         { text: "Maintain a friendly and supportive tone." }
     ];


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
            // Khusus untuk error model tidak ditemukan atau fitur tidak didukung
            if (apiResponse.status === 404 && errorData.error?.message.toLowerCase().includes("model not found")) {
                errorMessage = `The specified AI model ('${apiModelName}') was not found. Please check the model name.`;
            } else if (apiResponse.status === 400 && errorData.error?.message.toLowerCase().includes("unsupported") || errorData.error?.message.toLowerCase().includes("invalid argument")) {
                 errorMessage = `The AI model ('${apiModelName}') may not support some features used (like systemInstruction or input format). Error: ${errorData.error.message}`;
            } else if (apiResponse.status === 400 && errorData.error?.message.toLowerCase().includes("context")) {
                 // Handle potential context window errors if history is too long
                 errorMessage = `The conversation history is too long for the model. Please start a new chat or reduce history length. Error: ${errorData.error.message}`;
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
                     responseText = "Maaf, terjadi masalah saat menghasilkan respons (Reason: " + data.candidates[0].finishReason + ").";
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

// System Instruction Parts Definition (moved here for clarity)
const systemInstructionParts = [
    { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant." },
    { text: "When responding, if it feels natural and appropriate for the conversation, try to ask a follow-up question to better understand the user's needs or to encourage them to elaborate." },
    { text: "If the user seems to be facing a challenge or expressing uncertainty, try to offer a sense of encouragement or briefly suggest potential positive perspectives or general avenues they might consider exploring. Frame these as possibilities, not definitive solutions unless you are highly confident." },
    { text: "Maintain a friendly and supportive tone." }
];