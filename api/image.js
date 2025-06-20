// File: /api/generateImage.js
import fetch from 'node-fetch'; // Atau gunakan fetch global jika Vercel Anda mendukungnya dengan baik dan Anda tidak menjalankan lokal dengan Node.js versi lama

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Missing prompt for image generation' });
    }

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
        console.error('Stability API key is not configured on the server.');
        return res.status(500).json({ message: 'Image generation service is not configured.' });
    }

    // Pilih engine ID. 'stable-diffusion-xl-1024-v1-0' adalah model SDXL yang bagus.
    // Opsi lain: 'stable-diffusion-v1-6' (lebih ringan)
    // Periksa dokumentasi Stability AI untuk daftar engine terbaru dan yang paling sesuai.
    const engineId = 'stable-diffusion-xl-1024-v1-0'; 
    const apiHost = process.env.API_HOST || 'https://api.stability.ai';
    const apiUrl = `${apiHost}/v1/generation/${engineId}/text-to-image`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', 
                'Authorization': `Bearer ${STABILITY_API_KEY}`,
            },
            body: JSON.stringify({
                text_prompts: [{ text: prompt }],
                cfg_scale: 7,       
                height: 512,        // Untuk SDXL, bisa coba 1024 jika ingin kualitas lebih tinggi
                width: 512,         // Untuk SDXL, bisa coba 1024
                samples: 1,         
                steps: 30,          // Jumlah langkah difusi, 20-50 umum. Lebih banyak = lebih detail tapi lebih lama.
                // style_preset: "photographic", // Opsional: "photographic", "digital-art", "comic-book", dll. Lihat dokumentasi.
                // sampler: "K_DPMPP_2M" // Opsional: Algoritma sampler. Default biasanya sudah baik.
            }),
        });

        if (!response.ok) {
            // Coba baca detail error dari Stability AI
            let errorBody = 'Unknown error from Stability AI';
            try {
                const errorData = await response.json();
                errorBody = errorData.message || JSON.stringify(errorData.errors) || response.statusText;
            } catch (e) {
                errorBody = response.statusText;
            }
            console.error(`Stability AI API Error (${response.status}):`, errorBody);
            throw new Error(`Failed to generate image with Stability AI: ${errorBody}`);
        }

        const responseJSON = await response.json();
        
        if (responseJSON.artifacts && responseJSON.artifacts.length > 0 && responseJSON.artifacts[0].base64) {
            const imageBase64 = responseJSON.artifacts[0].base64;
            const imageUrl = `data:image/png;base64,${imageBase64}`; // Data URL untuk ditampilkan langsung di <img>
            res.status(200).json({ imageUrl: imageUrl });
        } else {
            console.error('No image artifacts found in Stability AI response:', responseJSON);
            throw new Error('No image artifacts found in Stability AI response.');
        }

    } catch (error) {
        console.error('Error in /api/generateImage handler:', error);
        res.status(500).json({ message: error.message || 'An internal server error occurred while generating the image.' });
    }
}
