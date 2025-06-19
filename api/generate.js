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
        apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
        requestBody = { contents: [{ parts: [{ text: userMessage }] }] };
    } else if (model === 'cohere') {
        apiEndpoint = 'https://api.cohere.ai/v1/chat';
        requestBody = { message: userMessage, model: "command-r-plus", temperature: 0.7 };
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        requestHeaders['Cohere-Version'] = '2024-02-15';
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
        if (model === 'gemini' && data.candidates?.[0]?.content.parts?.[0]?.text) {
            responseText = data.candidates[0].content.parts[0].text;
        } else if (model === 'cohere' && data.text) {
            responseText = data.text;
        } else {
            throw new Error('Invalid response format from API');
        }

        res.status(200).json({ text: responseText });

    } catch (error) {
        console.error('Internal Server Error:', error);
        res.status(500).json({ message: error.message || 'An internal server error occurred' });
    }
          }
