// File: pages/api/generate-image-dalle.js
// Endpoint untuk membuat gambar menggunakan OpenAI DALL-E API.

import OpenAI from 'openai';
// import fetch from 'node-fetch'; // Biasanya tidak perlu di Next.js API routes karena fetch sudah global

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.log(`[API /api/generate-image-dalle] Method ${req.method} Not Allowed.`);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        console.log('[API /api/generate-image-dalle] Bad Request: Missing or invalid prompt.');
        return res.status(400).json({ message: 'Deskripsi gambar tidak boleh kosong.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        console.error('[API /api/generate-image-dalle] SERVER CONFIGURATION ERROR: OPENAI_API_KEY is not set in Vercel environment variables or .env.local.');
        return res.status(500).json({ message: 'Layanan generasi gambar tidak terkonfigurasi (API Key Missing).' });
    }

    // Inisialisasi klien OpenAI
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    console.log(`[API /api/generate-image-dalle] Request to generate image for prompt: "${prompt}"`);

    try {
        const imageResponse = await openai.images.generate({
            model: "dall-e-3", // Gunakan dall-e-3 untuk kualitas terbaik, atau dall-e-2 untuk biaya lebih rendah
            prompt: prompt,
            n: 1, // DALL-E 3 hanya mendukung n=1
            size: "1024x1024", // Ukuran gambar. Untuk dall-e-3: "1024x1024", "1024x1792", "1792x1024"
            response_format: "url", // Dapatkan URL langsung ke gambar yang dihasilkan
            quality: "standard", // Opsional: "standard" atau "hd"
            style: "vivid", // Opsional: "vivid" atau "natural"
        });

        if (!imageResponse.data || imageResponse.data.length === 0) {
            console.log('[API /api/generate-image-dalle] No image data received from DALL-E.');
            return res.status(500).json({ message: 'Gagal membuat gambar: Tidak ada data gambar yang diterima dari DALL-E.' });
        }

        const imageUrl = imageResponse.data[0].url;
        console.log('[API /api/generate-image-dalle] Image generated successfully via DALL-E.');
        return res.status(200).json({ imageUrl: imageUrl });

    } catch (error) {
        console.error('[API /api/generate-image-dalle] Catch block error:', error);

        let errorMessage = 'Terjadi kesalahan internal server saat membuat gambar dengan DALL-E.';
        let statusCode = 500;

        if (error.response) { // Error dari respons API OpenAI
            errorMessage = error.response.data.error?.message || errorMessage;
            statusCode = error.response.status || statusCode;
            console.error('OpenAI API Error Details:', error.response.data);
        } else if (error.message) { // Error umum (misal, jaringan)
            errorMessage = error.message;
        }

        return res.status(statusCode).json({ message: `Gagal membuat gambar: ${errorMessage}`, errorType: 'dalle_api_error' });
    }
}