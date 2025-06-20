// File: /api/image.js
// Endpoint untuk menghasilkan gambar menggunakan Stability AI API.

import fetch from 'node-fetch'; // Diperlukan untuk lingkungan Node.js di Vercel Serverless Functions

export default async function handler(req, res) {
    // 1. Hanya izinkan metode POST
    if (req.method !== 'POST') {
        console.log(`Method ${req.method} Not Allowed for /api/image`);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Ambil prompt dari body request
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        console.log('Bad Request: Missing or invalid prompt for image generation.');
        return res.status(400).json({ message: 'Missing or invalid prompt for image generation' });
    }

    // 3. Ambil API Key dari Environment Variables
    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
        console.error('Server Configuration Error: STABILITY_API_KEY is not set.');
        return res.status(500).json({ message: 'Image generation service is currently unavailable due to server configuration.' });
    }

    // 4. Konfigurasi untuk API Stability AI
    // Model engine yang direkomendasikan untuk kualitas tinggi: 'stable-diffusion-xl-1024-v1-0'
    // Alternatif lebih ringan: 'stable-diffusion-v1-6'
    // Selalu cek dokumentasi Stability AI untuk model terbaru dan yang paling sesuai.
    const engineId = 'stable-diffusion-xl-1024-v1-0'; 
    const apiHost = process.env.API_HOST || 'https://api.stability.ai'; // Default host, biasanya tidak perlu diubah
    const apiUrl = `${apiHost}/v1/generation/${engineId}/text-to-image`;

    console.log(`[API /api/image] Received image generation request for prompt: "${prompt}" using engine: ${engineId}`);

    try {
        // 5. Buat payload untuk API Stability AI
        const payload = {
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,           // Seberapa ketat gambar mengikuti prompt (umumnya 5-15)
            height: 512,            // Ukuran output gambar (tinggi). SDXL bisa 1024.
            width: 512,             // Ukuran output gambar (lebar). SDXL bisa 1024.
            samples: 1,             // Jumlah gambar yang ingin dihasilkan.
            steps: 30,              // Jumlah langkah difusi (20-50 adalah umum).
            // style_preset: "photographic", // Opsional: "photographic", "digital-art", "comic-book", "fantasy-art", "anime", "cinematic", dll.
                                        // Lihat dokumentasi Stability AI untuk daftar lengkap style preset yang didukung engine.
            // sampler: "K_DPMPP_2M",    // Opsional: Algoritma sampler. Default biasanya sudah baik.
            // seed: 0,                  // Opsional: Seed untuk reproduktifitas. 0 berarti acak.
        };

        console.log('[API /api/image] Sending request to Stability AI with payload:', JSON.stringify(payload, null, 2));

        // 6. Kirim permintaan ke Stability AI API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // Penting agar Stability AI mengembalikan JSON
                'Authorization': `Bearer ${STABILITY_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        // 7. Tangani respons dari Stability AI
        if (!response.ok) {
            let errorBody = `Stability AI API Error (${response.status})`;
            try {
                const errorData = await response.json(); 
                console.error('[API /api/image] Stability AI API Raw Error Response:', errorData);
                const stabilityErrorMessage = errorData.message || (errorData.errors && errorData.errors.join(', ')) || JSON.stringify(errorData);
                errorBody = `Failed to generate image: ${stabilityErrorMessage}`;
            } catch (e) {
                const textError = await response.text(); // Jika respons error bukan JSON
                console.error('[API /api/image] Stability AI API Raw Text Error Response:', textError);
                errorBody = `Failed to generate image: ${response.statusText || textError}`;
            }
            console.error(errorBody);
            // Mengembalikan status error asli dari Stability jika memungkinkan, atau 500
            return res.status(response.status < 500 ? response.status : 500).json({ message: errorBody });
        }

        const responseJSON = await response.json();
        // console.log('[API /api/image] Stability AI API Raw Success Response:', responseJSON);

        if (responseJSON.artifacts && responseJSON.artifacts.length > 0 && responseJSON.artifacts[0].base64) {
            const imageBase64 = responseJSON.artifacts[0].base64;
            // Gambar dikirim sebagai Data URL (base64 encoded string) agar bisa langsung digunakan di tag <img>
            const imageUrl = `data:image/png;base64,${imageBase64}`;
            
            console.log('[API /api/image] Image generated successfully. Sending Data URL to client.');
            res.status(200).json({ imageUrl: imageUrl });
        } else {
            console.error('[API /api/image] No image artifacts found in Stability AI response despite OK status:', responseJSON);
            throw new Error('No image artifacts found in Stability AI response.');
        }

    } catch (error) {
        console.error('[API /api/image] Error in handler:', error.message);
        res.status(500).json({ message: error.message || 'An internal server error occurred while generating the image.' });
    }
            }
