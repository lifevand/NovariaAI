// api/code.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ message: 'Prompt tidak boleh kosong.' });
    }

    const HF_API_TOKEN = process.env.HF_API_TOKEN; // Ambil dari Vercel Environment Variables
    if (!HF_API_TOKEN) {
        console.error('SERVER CONFIGURATION ERROR: HF_API_TOKEN is not set.');
        return res.status(500).json({ message: 'Layanan pembuatan kode tidak terkonfigurasi (Token API Hilang).' });
    }

    // Model DeepSeek Coder V2 Lite Instruct (ganti jika ada model V3 yang lebih spesifik dan tersedia di API gratis)
    // Untuk DeepSeek Coder v2 Instruct:
    const MODEL_ID = 'deepseek-ai/deepseek-coder-v2-lite-instruct';
    // Atau jika ada model v3 yang spesifik, contoh: (pastikan model ID ini benar)
    // const MODEL_ID = 'deepseek-ai/deepseek-coder-33b-instruct'; // Ini contoh, mungkin perlu model ID yang lebih kecil/spesifik untuk inference API gratis
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
    const modelDisplayName = "nova-coder-v3"; // Sesuai permintaan tampilan

    console.log(`[API /api/code] Request: "${prompt}", Model: ${MODEL_ID}`);

    try {
        const payload = {
            inputs: prompt,
            parameters: {
                return_full_text: false, // Penting untuk model instruct, hanya dapatkan teks yang dihasilkan
                max_new_tokens: 1024,    // Batas token yang dihasilkan, sesuaikan
                temperature: 0.7,        // Kreativitas (0.1 - 1.0), 0.7 cukup seimbang
                top_p: 0.9,
                do_sample: true,
            },
            // options: { wait_for_model: true } // Bisa menyebabkan timeout jika model lama loading
        };

        const hfResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!hfResponse.ok) {
            let errorBody = `Hugging Face API Error (${hfResponse.status})`;
            let errorJson;
            let isModelLoading = false;
            let estimatedTime = 0;

            try {
                const responseText = await hfResponse.text();
                try {
                    errorJson = JSON.parse(responseText);
                    errorBody = errorJson.error || JSON.stringify(errorJson);
                    if (hfResponse.status === 503 && errorJson.estimated_time) {
                        isModelLoading = true;
                        estimatedTime = Math.ceil(errorJson.estimated_time);
                        errorBody = `Model (${MODEL_ID}) sedang dimuat. Perkiraan waktu: ${estimatedTime} detik.`;
                    }
                } catch (e) {
                    errorBody = responseText.length > 300 ? hfResponse.statusText : responseText; // Batasi panjang error mentah
                }
            } catch (e) {
                errorBody = `Gagal membaca respons error dari Hugging Face: ${hfResponse.statusText}`;
            }

            console.error(`[API /api/code] Hugging Face Error: ${errorBody}`);
            if (isModelLoading) {
                return res.status(503).json({
                    message: errorBody,
                    errorType: 'model_loading',
                    estimated_time: estimatedTime
                });
            }
            return res.status(hfResponse.status >= 400 && hfResponse.status < 500 ? hfResponse.status : 500)
                      .json({ message: errorBody, errorType: 'api_error' });
        }

        const result = await hfResponse.json();

        // Struktur respons Hugging Face bisa bervariasi.
        // Umumnya untuk text-generation, ada di result[0].generated_text
        if (result && Array.isArray(result) && result[0] && result[0].generated_text) {
            const generatedCode = result[0].generated_text.trim();
            // Deteksi bahasa sederhana (bisa dipercanggih)
            let language = 'plaintext';
            if (generatedCode.match(/```(\w+)/)) {
                language = generatedCode.match(/```(\w+)/)[1];
            } else if (prompt.toLowerCase().includes('python')) language = 'python';
            else if (prompt.toLowerCase().includes('javascript') || prompt.toLowerCase().includes('js')) language = 'javascript';
            else if (prompt.toLowerCase().includes('java')) language = 'java';
            else if (prompt.toLowerCase().includes('html')) language = 'html';
            else if (prompt.toLowerCase().includes('css')) language = 'css';


            console.log('[API /api/code] Code generated successfully.');
            return res.status(200).json({ code: generatedCode, language: language, modelName: modelDisplayName });
        } else {
            console.error('[API /api/code] Respons tidak valid dari Hugging Face:', result);
            throw new Error('Menerima format respons tidak terduga dari layanan AI.');
        }

    } catch (error) {
        console.error('[API /api/code] Catch block error:', error);
        return res.status(500).json({ message: error.message || 'Terjadi kesalahan internal server.', errorType: 'internal_server_error' });
    }
}
