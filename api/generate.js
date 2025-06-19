// File: /api/generate.js
// Ini adalah Serverless Function yang berjalan di server Vercel.

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil data yang dikirim dari frontend
    const { userMessage, model } = req.body;

    if (!userMessage || !model) {
        return res.status(400).json({ message: 'Missing userMessage or model' });
    }

    // 3. Pilih API Key yang benar dari Environment Variables Vercel
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
    
    // 4. Siapkan request ke API AI yang sebenarnya
    let apiEndpoint;
    let requestBody;
    let requestHeaders = {
        'Content-Type': 'application/json',
    };

    if (model === 'gemini') {
        // Menggunakan model Gemini 1.5 Flash yang lebih baru dan mendukung system instructions jika diperlukan
        apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        // Struktur request Gemini bisa lebih kompleks, contoh dasar:
        requestBody = {
            contents: [{
                parts: [{ text: userMessage }]
            }],
            // Contoh system instruction jika ingin menggunakannya
            // systemInstruction: {
            //     parts: [{ text: "You are Novaria, an AI assistant. Be helpful and friendly."}]
            // }
        };
    } else if (model === 'cohere') {
        apiEndpoint = 'https://api.cohere.ai/v1/chat';
        requestBody = { message: userMessage, model: "command-r-plus", temperature: 0.7 };
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        requestHeaders['Cohere-Version'] = '2024-02-15'; // Atau versi terbaru yang direkomendasikan Cohere
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
            return res.status(apiResponse.status).json({ message: `Error from ${model} API: ${errorData.error?.message || 'Unknown error'}` });
        }

        const data = await apiResponse.json();

        // 6. Ekstrak teks jawaban dan kirim kembali ke frontend
        let responseText = '';
        if (model === 'gemini') {
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
                responseText = data.candidates[0].content.parts[0].text;
            } else {
                // Tangani kasus jika struktur tidak seperti yang diharapkan, misal ada safetyRatings block
                if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === "SAFETY") {
                     responseText = "Maaf, saya tidak dapat memberikan respons untuk permintaan ini karena alasan keamanan.";
                } else {
                    console.error('Unexpected Gemini response structure:', data);
                    throw new Error('Invalid response format from Gemini API');
                }
            }
        } else if (model === 'cohere' && data.text) {
            responseText = data.text;
        } else {
            console.error(`Unexpected API response structure from ${model}:`, data);
            throw new Error(`Invalid response format from ${model} API`);
        }

        res.status(200).json({ text: responseText });

    } catch (error) {
        console.error('Internal Server Error:', error);
        res.status(500).json({ message: error.message || 'An internal server error occurred' });
    }
}