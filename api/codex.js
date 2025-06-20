// api/codex.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ message: 'Prompt tidak boleh kosong.' });
    }

    const HF_API_TOKEN = process.env.HF_API_TOKEN;
    if (!HF_API_TOKEN) {
        console.error('[API /api/codex] SERVER CONFIGURATION ERROR: HF_API_TOKEN is not set.');
        return res.status(500).json({ message: 'Layanan Codex tidak terkonfigurasi (Token API Hilang).' });
    }

    const MODEL_ID = 'deepseek-ai/deepseek-coder-6.7b-instruct'; // Atau model lain yang Anda pilih
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
    // const modelDisplayName = "nova-coder-v3"; // Ini akan ditampilkan di UI dari JS awal

    console.log(`[API /api/codex] Request: "${prompt}", Model: ${MODEL_ID}`);

    try {
        const payload = {
            inputs: prompt,
            parameters: {
                return_full_text: false,
                max_new_tokens: 1536,
                temperature: 0.7,
                top_p: 0.95,
                do_sample: true,
            },
            options: {
                wait_for_model: true, // Mungkin perlu diset false jika sering timeout dan handle 503 di frontend
                use_cache: false
            }
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
            // ... (Penanganan error sama seperti di api/program.js, ganti console log ke [API /api/codex]) ...
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
                        errorBody = `Model (${MODEL_ID}) sedang dimuat. Perkiraan waktu: ${estimatedTime} detik. Silakan coba lagi.`;
                    }
                } catch (e) { errorBody = responseText.length > 300 ? `${hfResponse.statusText} (Response too long)` : responseText; }
            } catch (e) { errorBody = `Gagal membaca respons error dari Hugging Face: ${hfResponse.statusText}`; }
            console.error(`[API /api/codex] Hugging Face Error: Status ${hfResponse.status}, Body: ${errorBody}`);
            if (isModelLoading) return res.status(503).json({ message: errorBody, errorType: 'model_loading', estimated_time: estimatedTime });
            let clientStatusCode = hfResponse.status >= 400 && hfResponse.status < 500 ? hfResponse.status : 500;
            return res.status(clientStatusCode).json({ message: `Gagal berkomunikasi dengan layanan AI: ${errorBody}`, errorType: 'api_error' });
        }

        const result = await hfResponse.json();

        if (result && Array.isArray(result) && result[0] && typeof result[0].generated_text === 'string') {
            let generatedCode = result[0].generated_text.trim();
            let language = 'plaintext';
            const codeBlockMatch = generatedCode.match(/^```(\w+)?\n([\s\S]*?)\n```$/);
            if (codeBlockMatch) {
                language = codeBlockMatch[1] || 'plaintext';
                generatedCode = codeBlockMatch[2].trim();
            } else { /* Deteksi bahasa sederhana */ }
            console.log('[API /api/codex] Code generated successfully.');
            // Tidak mengirim modelName dari sini karena sudah ada di UI awal
            return res.status(200).json({ code: generatedCode, language: language });
        } else {
            console.error('[API /api/codex] Respons tidak valid dari Hugging Face:', JSON.stringify(result, null, 2));
            throw new Error('Menerima format respons tidak terduga dari layanan AI.');
        }
    } catch (error) {
        console.error('[API /api/codex] Catch block error:', error.message);
        return res.status(500).json({ message: `Terjadi kesalahan internal server: ${error.message}`, errorType: 'internal_server_error' });
    }
        }
