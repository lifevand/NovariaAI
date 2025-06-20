// File: /api/google-image-search.js
// Endpoint untuk mencari gambar menggunakan Google Custom Search JSON API.

import fetch from 'node-fetch'; // Pastikan node-fetch terinstal jika belum

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.log(`[API /api/google-image-search] Method ${req.method} Not Allowed.`);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        console.log('[API /api/google-image-search] Bad Request: Missing or invalid prompt.');
        return res.status(400).json({ message: 'Deskripsi gambar tidak boleh kosong.' });
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        console.error('[API /api/google-image-search] SERVER CONFIGURATION ERROR: GOOGLE_API_KEY or GOOGLE_CSE_ID is not set in Vercel environment variables or .env.local.');
        return res.status(500).json({ message: 'Layanan pencarian gambar tidak terkonfigurasi (API Key/CX ID Missing).' });
    }

    // Parameter untuk Google Custom Search API
    const searchParams = new URLSearchParams({
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: prompt,
        searchType: 'image', // Wajib untuk pencarian gambar
        num: 5,             // Jumlah hasil yang diinginkan (ambil 5, kita pakai yang pertama)
        safe: 'active',     // Opsi filter SafeSearch (active, medium, off)
        // Anda bisa tambahkan parameter lain seperti:
        // rights: '(cc_publicdomain|cc_attribute|cc_sharealike|cc_noncommercial|cc_nonderived)' // Untuk filter lisensi Creative Commons
        // imgSize: 'large' // (icon, small, medium, large, xlarge, xxlarge, huge)
        // imgType: 'photo' // (clipart, face, lineart, stock, photo, animated)
    });

    const API_URL = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;

    // Jangan log API key secara penuh di produksi
    const safeLogUrl = API_URL.replace(GOOGLE_API_KEY, 'REDACTED_API_KEY');
    console.log(`[API /api/google-image-search] Request: "${prompt}", URL: ${safeLogUrl}`);

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error?.message || `Google API Error (${response.status})`;
            console.error(`[API /api/google-image-search] Google API Error: ${errorMessage}`, data.error?.errors);
            // Memberikan status yang lebih spesifik jika ada dari Google
            let statusCode = response.status >= 400 && response.status < 500 ? response.status : 500;
            if (data.error?.code) statusCode = data.error.code; // Gunakan kode error dari Google jika ada
            
            return res.status(statusCode)
                      .json({ message: `Gagal mencari gambar: ${errorMessage}`, errorType: 'api_error' });
        }

        if (data.items && data.items.length > 0) {
            // Coba cari gambar pertama yang valid dan merupakan tipe gambar umum
            const firstValidImage = data.items.find(item =>
                item.link &&
                item.mime &&
                (item.mime.startsWith('image/jpeg') || item.mime.startsWith('image/png') || item.mime.startsWith('image/gif') || item.mime.startsWith('image/webp'))
            );

            if (firstValidImage) {
                const imageUrl = firstValidImage.link;
                console.log('[API /api/google-image-search] Image found via Google Custom Search.');
                return res.status(200).json({ imageUrl: imageUrl });
            } else {
                // Jika data.items ada tapi tidak ada yang cocok dengan kriteria mime
                console.log('[API /api/google-image-search] No valid image link (JPEG, PNG, GIF, WEBP) found in Google results though items exist.');
                return res.status(404).json({ message: 'Tidak ada gambar dengan format yang didukung ditemukan.', errorType: 'no_suitable_format' });
            }
        } else {
            console.log('[API /api/google-image-search] No items found in Google results.');
            return res.status(404).json({ message: 'Tidak ada gambar yang ditemukan untuk deskripsi tersebut.', errorType: 'no_results' });
        }

    } catch (error) {
        console.error('[API /api/google-image-search] Catch block error:', error);
        return res.status(500).json({ message: error.message || 'Terjadi kesalahan internal server saat mencari gambar.', errorType: 'internal_server_error' });
    }
                      }
