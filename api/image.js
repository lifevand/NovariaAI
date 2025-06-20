// File: /api/image.js
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

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
        console.error('[API /api/image] SERVER CONFIGURATION ERROR: STABILITY_API_KEY is not set.');
        return res.status(500).json({ message: 'Layanan pembuatan gambar tidak terkonfigurasi dengan benar di server. (API Key Missing)' });
    }

    const engineId = 'stable-diffusion-xl-1024-v1-0'; 
    const apiHost = 'https://api.stability.ai';
    const apiUrl = `${apiHost}/v1/generation/${engineId}/text-to-image`;

    console.log(`[API /api/image] Request: "${prompt}", Engine: ${engineId}`);

    try {
        const payload = {
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: 512,
            width: 512,
            samples: 1,
            steps: 30,
            // style_preset: "photographic", 
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', 
                'Authorization': `Bearer ${STABILITY_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Mencoba membaca respons error sebagai teks terlebih dahulu, karena bisa jadi bukan JSON
            const errorText = await response.text();
            console.error(`[API /api/image] Stability AI API Error (${response.status}): ${errorText}`);
            
            let userFriendlyMessage = `Gagal menghubungi layanan gambar (Status: ${response.status}).`;
            // Coba parse sebagai JSON jika memungkinkan, untuk pesan error yang lebih spesifik dari Stability AI
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    userFriendlyMessage = `Error dari layanan gambar: ${errorJson.message}`;
                } else if (errorJson.errors && Array.isArray(errorJson.errors)) {
                    userFriendlyMessage = `Error dari layanan gambar: ${errorJson.errors.join(', ')}`;
                }
            } catch (e) {
                // Jika parsing JSON gagal, gunakan errorText mentah (jika tidak terlalu teknis)
                // Atau tetap gunakan pesan generik
                if (errorText.length < 200) { // Jangan tampilkan HTML error yang panjang
                    userFriendlyMessage = `Error dari layanan gambar: ${errorText}`;
                }
            }
            
            // Periksa error spesifik seperti API key tidak valid
            if (response.status === 401) { // Unauthorized
                userFriendlyMessage = "Autentikasi ke layanan gambar gagal. Periksa konfigurasi API Key.";
            }

            return res.status(500).json({ message: userFriendlyMessage });
        }

        const responseJSON = await response.json();
        
        if (responseJSON.artifacts && responseJSON.artifacts.length > 0 && responseJSON.artifacts[0].base64) {
            const imageBase64 = responseJSON.artifacts[0].base64;
            const imageUrl = `data:image/png;base64,${imageBase64}`;
            console.log('[API /api/image] Image generated successfully.');
            return res.status(200).json({ imageUrl: imageUrl });
        } else {
            console.error('[API /api/image] No image artifacts in Stability AI response:', responseJSON);
            return res.status(500).json({ message: 'Format respons dari layanan gambar tidak sesuai.' });
        }

    } catch (error) {
        console.error('[API /api/image] Catch block error:', error);
        // Mengembalikan pesan error yang lebih umum jika terjadi kesalahan tak terduga
        return res.status(500).json({ message: 'Terjadi kesalahan internal saat membuat gambar.' });
    }
            }
