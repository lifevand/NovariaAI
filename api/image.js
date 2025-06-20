// File: /api/image.js
// Endpoint untuk menghasilkan gambar menggunakan Hugging Face Inference API dengan model FLUX.

import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.log(`[API /api/image] Method ${req.method} Not Allowed.`);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        console.log('[API /api/image] Bad Request: Missing or invalid prompt.');
        return res.status(400).json({ message: 'Deskripsi gambar tidak boleh kosong.' });
    }

    const HF_API_TOKEN = process.env.HF_API_TOKEN;
    if (!HF_API_TOKEN) {
        console.error('[API /api/image] SERVER CONFIGURATION ERROR: HF_API_TOKEN is not set.');
        return res.status(500).json({ message: 'Layanan pembuatan gambar tidak terkonfigurasi (Token Missing).' });
    }

    // Menggunakan model FLUX.1-dev
    const MODEL_ID = 'runwayml/stable-diffusion-v1-5';
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

    console.log(`[API /api/image] Request: "${prompt}", Model: ${MODEL_ID}`);

    try {
        const payload = {
            inputs: prompt,
            // FLUX mungkin tidak memerlukan parameter tambahan, tapi opsi ini bisa berguna
            // untuk memaksa API menunggu model jika sedang tidak aktif.
            // Namun, ini bisa menyebabkan timeout jika model terlalu lama loading.
            // Sebaiknya frontend yang menangani retry jika model loading.
            // options: { wait_for_model: true, use_gpu: true } 
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
                // 'Accept': 'image/png' // Tidak perlu Accept header spesifik, API akan return blob
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            let errorBody = `Hugging Face API Error (${response.status})`;
            let errorJson;
            let isModelLoading = false;
            let estimatedTime = 0;

            try {
                const responseText = await response.text(); // Baca sebagai teks dulu
                try {
                    errorJson = JSON.parse(responseText); // Coba parse sebagai JSON
                    errorBody = errorJson.error || JSON.stringify(errorJson);
                    if (response.status === 503 && errorJson.estimated_time) {
                        isModelLoading = true;
                        estimatedTime = Math.ceil(errorJson.estimated_time);
                        errorBody = `Model (${MODEL_ID}) sedang dimuat oleh Hugging Face. Perkiraan waktu: ${estimatedTime} detik.`;
                    }
                } catch (e) {
                    // Jika parsing JSON gagal, berarti respons error bukan JSON
                    errorBody = responseText.length > 500 ? response.statusText : responseText; // Batasi panjang error mentah
                    console.warn('[API /api/image] Hugging Face error response was not JSON:', responseText);
                }
            } catch (e) {
                // Gagal membaca body error sama sekali
                errorBody = `Gagal membaca respons error dari Hugging Face: ${response.statusText}`;
            }
            
            console.error(`[API /api/image] Hugging Face Error: ${errorBody}`);
            // Kirim status loading jika itu masalahnya
            if (isModelLoading) {
                return res.status(503).json({ 
                    message: errorBody, 
                    errorType: 'model_loading',
                    estimated_time: estimatedTime 
                });
            }
            return res.status(response.status >= 400 && response.status < 500 ? response.status : 500)
                      .json({ message: errorBody, errorType: 'api_error' });
        }

        const imageBlob = await response.blob();
        if (!imageBlob || imageBlob.size === 0) {
            console.error('[API /api/image] Received empty image blob from Hugging Face.');
            throw new Error('Menerima blob gambar kosong dari layanan AI.');
        }

        const buffer = await imageBlob.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const imageUrl = `data:${imageBlob.type || 'image/png'};base64,${base64Image}`;

        console.log('[API /api/image] Image generated successfully via Hugging Face.');
        return res.status(200).json({ imageUrl: imageUrl });

    } catch (error) {
        console.error('[API /api/image] Catch block error:', error);
        return res.status(500).json({ message: error.message || 'Terjadi kesalahan internal server saat membuat gambar.', errorType: 'internal_server_error' });
    }
                }
