// File: /api/generate.js
// Menggunakan model Gemini dengan systemInstruction untuk respons yang lebih dinamis
// dan memproses histori chat dari frontend untuk konteks, menggunakan model yang sudah ditentukan.

import fetch from 'node-fetch'; // Import fetch jika Anda menggunakan Node.js atau lingkungan Vercel/Netlify Edge Functions

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil data yang dikirim dari frontend
    // Frontend sekarang mengirim array 'messages' (histori + pesan baru)
    // dan array opsional 'fileDetails' (metadata file untuk pesan terbaru)
    // Kita ambil semuanya.
    const { messages, fileDetails, model } = req.body; // 'model' dari frontend juga diterima, tapi kita akan tetap pakai yang di backend

    // Validasi dasar: Pastikan 'messages' adalah array dan tidak kosong
    if (!Array.isArray(messages) || messages.length === 0) {
        // Kalau array messages kosong atau tidak valid, kembalikan error.
        // Minimal harus ada pesan user terakhir di array ini.
        return res.status(400).json({ message: 'Invalid or empty "messages" array in request body. Requires at least the current user message.' });
    }
    // Cek juga pesan user terakhir harus ada
     const lastMessage = messages[messages.length - 1];
     if (!lastMessage || lastMessage.sender !== 'user' || !lastMessage.content) {
          return res.status(400).json({ message: 'The last message in the "messages" array must be a user message with content.' });
     }


    // 3. Ambil API Key dari Environment Variables Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not configured.");
        return res.status(500).json({ message: 'Server configuration error: GEMINI_API_KEY is not set.' });
    }

    // 4. Tentukan nama model API yang akan digunakan
    // TETAP MENGGUNAKAN model yang sudah ada di backend
    const apiModelName = 'gemini-2.0-flash'; // Menggunakan model yang sudah ada

    // 5. Siapkan request body untuk Gemini API
    // Konversi format messages dari frontend [{sender: 'user'/'ai', content: '...'}]
    // ke format 'contents' Gemini API [{ role: 'user'/'model', parts: [{ text: '...' }, ...] }]

    const geminiContents = messages.map(msg => {
        // Map sender 'user' ke role 'user', dan 'ai' ke role 'model'
        // Gemini Chat API menggunakan role 'model' untuk respons AI
        const role = msg.sender === 'user' ? 'user' : 'model';

        // Untuk setiap pesan, buat array 'parts'.
        // Saat ini, kita hanya mengirim teks.
        let parts = [{ text: msg.content }];

        // --- Bagian ini TETAP SEBAGAI CATATAN KONSEPTUAL ---
        // Jika frontend mengimplementasikan pengiriman DATA file (bukan hanya metadata)
        // di dalam array 'messages' (misal di objek pesan user terakhir),
        // maka logic untuk menambahkan 'inlineData' parts perlu diaktifkan di sini.
        // Contoh: Jika objek pesan user terakhir punya properti `fileParts: [{ mimeType: '...', data: '...' }]`
        // if (msg === lastMessage && msg.fileParts && msg.fileParts.length > 0) {
        //      parts = parts.concat(msg.fileParts.map(fp => ({ inlineData: { mimeType: fp.mimeType, data: fp.data } })));
        // }
        // --- AKHIR CATATAN KONSEPTUAL ---

        return {
            role: role,
            parts: parts // Menggunakan parts yang sudah disiapkan (hanya teks untuk saat ini)
        };
    });

    // Pastikan systemInstructionParts didefinisikan
    const systemInstructionParts = [
        { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant." },
        { text: "When responding, if it feels natural and appropriate for the conversation, try to ask a follow-up question to better understand the user's needs or to encourage them to elaborate." },
        { text: "If the user seems to be facing a challenge or expressing uncertainty, try to offer a sense of encouragement or briefly suggest potential positive perspectives or general avenues they might consider exploring. Frame these as possibilities, not definitive solutions unless you are highly confident." },
        { text: "Maintain a friendly and supportive tone." }
    ];


    const requestBody = {
        // Kirim array contents yang sudah diformat (termasuk history dan pesan baru)
        contents: geminiContents,
        // systemInstruction di luar array contents (untuk model yang mendukung, seperti gemini-1.5)
        // PERHATIAN: gemini-2.0-flash mungkin tidak mendukung systemInstruction atau
        // mungkin memiliki cara berbeda untuk menggunakannya bersama history.
        // Jika Anda mengalami error "Unsupported" atau "Invalid Argument",
        // coba hapus bagian systemInstruction atau ganti model ke gemini-1.5-flash-latest.
        // Berdasarkan instruksi, kita tetap menyertakan systemInstruction.
        systemInstruction: {
            parts: systemInstructionParts
        },
        generationConfig: {
          temperature: 0.75,
        },
        // safetySettings: [ ... ] // Opsional: Sesuaikan pengaturan keamanan
    };

     // Jika model gemini-2.0-flash TIDAK mendukung systemInstruction di request body
     // bersama dengan array contents, Anda mungkin perlu menempatkan systemInstruction
     // sebagai pesan pertama dalam array contents dengan role 'system' (jika didukung modelnya)
     // atau menghapusnya sama sekali jika model yang digunakan tidak mendukungnya untuk chat.
     // Contoh alternatif body (JIKA systemInstruction di body tidak bekerja):
     /*
     const alternateContents = [
         { role: 'system', parts: systemInstructionParts }, // Cek dokumentasi model jika ini format yang benar
         ...geminiContents // Sisipkan history + pesan baru setelah system message
     ];
     const requestBodyAlternate = {
         contents: alternateContents,
         generationConfig: { temperature: 0.75 },
         // safetySettings: [...]
     };
     */


    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiModelName}:generateContent?key=${apiKey}`;
    const requestHeaders = {
        'Content-Type': 'application/json',
    };

    console.log("Sending payload to API:", JSON.stringify(requestBody, null, 2)); // Log payload lengkap

    // 6. Lakukan panggilan ke API AI
    try {
        const apiResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody), // Kirim body yang sudah diformat
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
            } else if (apiResponse.status === 400 && (errorData.error?.message.toLowerCase().includes("unsupported") || errorData.error?.message.toLowerCase().includes("invalid argument"))) {
                 // Ini sering terjadi jika format body (contents, systemInstruction) tidak cocok dengan model
                 errorMessage = `The AI model ('${apiModelName}') may not support the input format (history or systemInstruction). Error: ${errorData.error.message}`;
            } else if (apiResponse.status === 400 && errorData.error?.message.toLowerCase().includes("context")) {
                 // Handle potential context window errors if history is too long
                 errorMessage = `The conversation history is too long for the model. Please start a new chat or reduce history length. Error: ${errorData.error.message}`;
            }

            return res.status(apiResponse.status).json({ message: errorMessage });
        }

        const data = await apiResponse.json();

        // 7. Ekstrak teks jawaban dan kirim kembali ke frontend
        let responseText = '';
        // Struktur respons Gemini untuk chat completion
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
            responseText = data.candidates[0].content.parts[0].text;
        } else {
            // Tangani kasus jika respons tidak memiliki teks karena diblokir oleh safety filter atau format tidak terduga
            if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
                if (data.candidates[0].finishReason === "SAFETY") {
                    responseText = "Maaf, saya tidak dapat memberikan respons untuk permintaan ini karena batasan keamanan.";
                } else if (data.candidates[0].finishReason === "RECITATION") {
                    responseText = "Respons diblokir karena terdeteksi sebagai kutipan dari sumber yang dilindungi.";
                } else if (data.candidates[0].finishReason === "MAX_TOKENS") {
                     responseText = "Respons terpotong karena melebihi batas panjang token model.";
                }
                else if (data.candidates[0].finishReason === "OTHER") {
                     responseText = "Maaf, terjadi masalah saat menghasilkan respons (Reason: " + data.candidates[0].finishReason + ").";
                } else {
                    responseText = "Maaf, terjadi masalah saat menghasilkan respons (Reason: " + data.candidates[0].finishReason + ").";
                }
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                 responseText = "Permintaan Anda diblokir sebelum diproses oleh model (Reason: " + data.promptFeedback.blockReason + "). Harap sesuaikan permintaan Anda.";
            }
            else {
                console.error('Unexpected Gemini response structure:', data);
                // Mungkin ada error lain yang tidak ditangkap
                 responseText = "Maaf, terjadi kesalahan tak terduga dari API AI.";
            }
        }

        res.status(200).json({ text: responseText });

    } catch (error) {
        console.error('Internal Server Error in /api/generate:', error);
        // Kirim pesan error internal ke frontend
        res.status(500).json({ message: error.message || 'An internal server error occurred while contacting the AI model.' });
    }
}

// System Instruction Parts Definition (tetap di sini sesuai request)
const systemInstructionParts = [
    { text: "You are Novaria, a helpful, empathetic, and slightly proactive AI assistant." },
    { text: "When responding, if it feels natural and appropriate for the conversation, try to ask a follow-up question to better understand the user's needs or to encourage them to elaborate." },
    { text: "If the user seems to be facing a challenge or expressing uncertainty, try to offer a sense of encouragement or briefly suggest potential positive perspectives or general avenues they might consider exploring. Frame these as possibilities, not definitive solutions unless you are highly confident." },
    { text: "Maintain a friendly and supportive tone." }
];