// File: /api/image.js
// Endpoint untuk menghasilkan gambar menggunakan Hugging Face Inference API.

import fetch from 'node-fetch';

// Fungsi untuk menunggu model di Hugging Face siap jika sedang loading (opsional tapi berguna)
// async function queryHuggingFace(payload, modelUrl, apiKey, retries = 5, delay = 5000) {
//     for (let i = 0; i < retries; i++) {
//         const response = await fetch(modelUrl, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${apiKey}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(payload),
//         });

//         if (response.ok) {
//             // Jika respons OK, coba dapatkan blob gambar
//             // Hugging Face API untuk gambar mengembalikan blob, bukan JSON dengan base64
//             // Kita perlu mengubah blob ini menjadi base64
//             const imageBlob = await response.blob();
//             const buffer = await imageBlob.arrayBuffer();
//             const base64Image = Buffer.from(buffer).toString('base64');
//             return `data:${imageBlob.type};base64,${base64Image}`;
//         }

//         // Jika model sedang loading (error 503)
//         if (response.status === 503) {
//             const errorData = await response.json();
//             console.log(`[API /api/image] Model is loading (attempt ${i + 1}/${retries}). Estimated time: ${errorData.estimated_time}s. Retrying in ${delay / 1000}s...`);
//             await new Promise(resolve => setTimeout(resolve, delay));
//         } else {
//             // Error lain
//             let errorBody = `Hugging Face API Error (${response.status})`;
//             try {
//                 const errorJson = await response.json();
//                 errorBody = errorJson.error || JSON.stringify(errorJson);
//             } catch (e) {
//                 errorBody = await response.text();
//             }
//             throw new Error(errorBody);
//         }
//     }
//     throw new Error('Model did not become available after multiple retries.');
// }


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ message: 'Deskripsi gambar tidak boleh kosong.' });
    }

    const HF_API_TOKEN = process.env.HF_API_TOKEN;
    if (!HF_API_TOKEN) {
        console.error('[API /api/image] SERVER CONFIGURATION ERROR: HF_API_TOKEN is not set.');
        return res.status(500).json({ message: 'Layanan pembuatan gambar tidak terkonfigurasi (Token Missing).' });
    }

    // Ganti dengan ID model yang Anda pilih dari Hugging Face
    // Contoh: 'stabilityai/stable-diffusion-xl-base-1.0' atau 'runwayml/stable-diffusion-v1-5'
    const MODEL_ID = 'runwayml/stable-diffusion-v1-5'; // Model yang lebih ringan untuk testing awal
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

    console.log(`[API /api/image] Request: "${prompt}", Model: ${MODEL_ID}`);

    try {
        const payload = {
            inputs: prompt,
            // Beberapa model mungkin punya opsi tambahan, cek dokumentasi model di Hugging Face
            // options: { wait_for_model: true } // Bisa membantu jika model sering loading
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
                // 'Accept': 'image/png' // API HF mengembalikan blob gambar langsung
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            let errorBody = `Hugging Face API Error (${response.status})`;
            let errorJson;
            try {
                errorJson = await response.json(); // Model loading error biasanya JSON
                errorBody = errorJson.error || JSON.stringify(errorJson);
                if (response.status === 503 && errorJson.estimated_time) {
                     errorBody = `Model sedang dimuat, coba lagi dalam ${Math.ceil(errorJson.estimated_time)} detik. (${errorJson.error || ''})`;
                }
            } catch (e) {
                errorBody = await response.text(); // Error lain mungkin teks/HTML
            }
            console.error(`[API /api/image] Hugging Face Error: ${errorBody}`);
            return res.status(500).json({ message: errorBody });
        }

        // Hugging Face API untuk gambar mengembalikan blob gambar langsung, bukan JSON
        const imageBlob = await response.blob();
        if (!imageBlob || imageBlob.size === 0) {
            throw new Error('Received empty image blob from Hugging Face.');
        }

        // Ubah blob menjadi base64 Data URL
        const buffer = await imageBlob.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const imageUrl = `data:${imageBlob.type || 'image/png'};base64,${base64Image}`;

        console.log('[API /api/image] Image generated successfully via Hugging Face.');
        return res.status(200).json({ imageUrl: imageUrl });

    } catch (error) {
        console.error('[API /api/image] Catch block error:', error);
        return res.status(500).json({ message: error.message || 'Terjadi kesalahan internal saat membuat gambar.' });
    }
            }
