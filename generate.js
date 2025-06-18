// File: /api/generate.js (Implementasi Pilihan 1 - Sederhana)

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil data yang dikirim dari frontend
    // Sekarang kita juga mengharapkan 'fileDetails' jika ada
    const { userMessage, model, fileDetails } = req.body;

    if (!userMessage || !model) {
        return res.status(400).json({ message: 'Missing userMessage or model' });
    }

    // 3. Pilih API Key yang benar
    let apiKey;
    if (model === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY;
    } else if (model === 'cohere') {
        apiKey = process.env.COHERE_API_KEY;
    } else {
        return res.status(400).json({ message: 'Invalid model specified' });
    }

    if (!apiKey) {
        return res.status(500).json({ message: `API key for ${model} is not configured on the server.` });
    }
    
    // 4. Siapkan request ke API AI
    // Tambahkan informasi file ke userMessage jika ada
    let augmentedUserMessage = userMessage;
    if (fileDetails && Array.isArray(fileDetails) && fileDetails.length > 0) {
        const fileDescriptions = fileDetails.map(f => `${f.name} (tipe: ${f.type}, ukuran: ${(f.size / 1024).toFixed(1)} KB)`).join('; ');
        // Anda bisa memilih format string yang berbeda untuk informasi file
        augmentedUserMessage += `\n\n[Informasi File Terlampir: ${fileDescriptions}]`;
        // Atau, jika Anda ingin lebih terstruktur untuk AI:
        // augmentedUserMessage += `\n\n[The user has attached the following file(s): ${fileDescriptions}. Please consider this information if relevant to the query.]`;
    }

    let apiEndpoint;
    let requestBody;
    let requestHeaders = {
        'Content-Type': 'application/json',
    };

    if (model === 'gemini') {
        // Tetap menggunakan gemini-1.5-flash atau model teks lainnya
        apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        // Kirim augmentedUserMessage yang sudah berisi info file
        requestBody = { contents: [{ parts: [{ text: augmentedUserMessage }] }] };
    } else if (model === 'cohere') {
        apiEndpoint = 'https://api.cohere.ai/v1/chat';
        // Kirim augmentedUserMessage yang sudah berisi info file
        requestBody = { message: augmentedUserMessage, model: "command-r-plus", temperature: 0.7 };
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        // requestHeaders['Cohere-Version'] = '2024-02-15'; // Sudah tidak diperlukan jika model command-r-plus
    }

    // 5. Lakukan panggilan ke API AI dari server Vercel
    try {
        const apiResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error(`API Error from ${model}:`, errorData);
            // Memberikan pesan error yang lebih spesifik jika tersedia dari API AI
            const specificApiErrorMessage = errorData.error?.message || errorData.message || 'Unknown error from AI API';
            return res.status(apiResponse.status).json({ message: `Error from ${model} API: ${specificApiErrorMessage}` });
        }

        const data = await apiResponse.json();

        // 6. Ekstrak teks jawaban dan kirim kembali ke frontend
        let responseText = '';
        if (model === 'gemini') {
            const candidate = data.candidates?.[0];
            if (candidate?.content?.parts?.[0]?.text) {
                responseText = candidate.content.parts[0].text;
            } else if (candidate?.finishReason && candidate.finishReason !== "STOP") {
                responseText = `Respons dihentikan karena: ${candidate.finishReason}.`;
                if (candidate.safetyRatings) {
                    try {
                        responseText += ` Peringkat keamanan: ${JSON.stringify(candidate.safetyRatings)}`;
                    } catch (e) { /* Abaikan jika parsing gagal */ }
                }
            } else {
                 responseText = "Menerima respons dari Gemini, tetapi tidak ada bagian teks yang ditemukan.";
                 console.warn("No text part in Gemini response:", data);
            }
        } else if (model === 'cohere' && data.text) {
            responseText = data.text;
        } else {
            console.error('Invalid response format from API or no text found:', data);
            // Jangan throw error di sini agar frontend tetap dapat pesan JSON error
            return res.status(500).json({ message: 'Format respons tidak valid dari API atau tidak ada teks ditemukan' });
        }

        res.status(200).json({ text: responseText });

    } catch (error) {
        console.error('Internal Server Error calling AI API:', error);
        res.status(500).json({ message: error.message || 'Terjadi kesalahan internal server saat memanggil API AI' });
    }
}