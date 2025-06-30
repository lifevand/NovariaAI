// File: /api/generate.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import 'dotenv/config'; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Ambil data dari request body
    const { userMessage, conversationHistory, attachedFiles, selectedModel } = req.body;

    if (!userMessage) {
        return res.status(400).json({ message: 'Missing userMessage' });
    }

    // --- BAGIAN BARU: FILTER KRITIK PEMERINTAH/NEGARA INDONESIA ---
    const lowerCaseUserMessage = userMessage.toLowerCase();

    // Daftar kata kunci atau frasa yang akan memicu pemblokiran.
    // Anda bisa menyesuaikannya sesuai kebutuhan dan seberapa ketat filternya.
    const sensitiveKeywords = [
        "kritik pemerintah indonesia",
        "kritik negara indonesia",
        "keburukan pemerintah indonesia",
        "sisi gelap indonesia",
        "masalah pemerintah indonesia",
        "kekurangan indonesia",
        "kejahatan pemerintah indonesia",
        "korupsi indonesia",
        "penindasan pemerintah indonesia",
        "pemerintahan indonesia buruk",
        "negara indonesia buruk",
        "aib indonesia",
        "skandal pemerintah",
        "jeleknya indonesia",
        // Tambahkan variasi lain yang mungkin digunakan pengguna
        // Pertimbangkan juga variasi spasi atau typo ringan jika diperlukan (tapi bisa jadi over-blocking)
    ];

    // Cek apakah pesan pengguna mengandung salah satu kata kunci sensitif
    const isSensitiveRequest = sensitiveKeywords.some(keyword => lowerCaseUserMessage.includes(keyword));

    if (isSensitiveRequest) {
        // Kirim respons error kustom tanpa memanggil model AI
        return res.status(403).json({ 
            message: "Maaf, sebagai AI, saya diprogram untuk tetap netral dan tidak dapat memproses permintaan yang berkaitan dengan kritik atau hal negatif spesifik mengenai pemerintahan atau negara Indonesia. Fokus saya adalah memberikan informasi yang membantu, produktif, dan positif. Mohon ajukan pertanyaan lain." 
        });
    }
    // --- AKHIR BAGIAN BARU ---


    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // *** PENTING: Gunakan model yang dipilih dari frontend ***
    // Default ke 'gemini-1.5-flash' jika selectedModel tidak ada atau tidak valid
    // Kita cek dulu apakah selectedModel valid agar tidak crash jika ada nama model aneh dari frontend
    // --- PERUBAHAN DI SINI: MENYESUAIKAN DAFTAR MODEL DAN DEFAULT ---
    const availableModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']; // Daftar model yang didukung
    const apiModelName = availableModels.includes(selectedModel) ? selectedModel : 'gemini-1.5-flash';
    // --- AKHIR PERUBAHAN ---

    // Sesuaikan konfigurasi generasi berdasarkan model
    // Model 'Smart' (gemini-2.0-flash) biasanya butuh temperature lebih rendah untuk respons yang lebih faktual/konsisten.
    // Model 'Fast' (gemini-2.5-flash) dan 'Default' (gemini-1.5-flash) bisa lebih tinggi untuk kreativitas atau tetap rendah untuk kecepatan.
    let generationConfig = {};
    // --- PERUBAHAN DI SINI: MENYESUAIKAN LOGIKA GENERATION CONFIG BERDASARKAN NAMA MODEL BARU ---
    if (apiModelName === 'gemini-2.0-flash') { // Untuk model "smart"
        generationConfig = {
            temperature: 0.6, // Agak lebih konservatif untuk model Smart
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2048,
        };
    } else { // Default untuk gemini-1.5-flash dan gemini-2.5-flash (Fast)
        generationConfig = {
            temperature: 0.8, // Lebih kreatif dan beragam untuk Flash
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2048,
        };
    }
    // --- AKHIR PERUBAHAN ---
    
    // *** System Instruction yang Ditingkatkan untuk "Maksimum Power" ***
    // Ini adalah kunci agar AI berperilaku sesuai keinginan.
    // Jelas, spesifik, dan meliputi berbagai skenario.
    const systemInstructionParts = [
        { text: "Anda adalah Novaria, asisten AI yang sangat membantu, ramah, proaktif, dan selalu memberikan informasi akurat dan komprehensif. Tujuan utama Anda adalah memberikan respons yang mendalam, relevan, dan memotivasi." },
        { text: "Jangan gunakan formatting Markdown untuk bolding (**, __), italicizing (*, _), atau inline styles lainnya di dalam teks biasa. Gunakan teks biasa untuk semua respons kecuali saat Anda secara eksplisit menghasilkan blok kode atau tabel yang memerlukan Markdown." },
        { text: "Apabila respons Anda melibatkan informasi yang kompleks atau multi-step, pecah menjadi poin-poin atau langkah-langkah yang jelas untuk kemudahan pemahaman." },
        { text: "Setelah setiap respons, jika terasa alami dan sesuai konteks, coba ajukan pertanyaan lanjutan yang cerdas atau sarankan langkah berikutnya yang relevan untuk mendorong interaksi lebih lanjut dan menggali kebutuhan pengguna secara lebih dalam. Pertanyaan ini harus mengarah pada eksplorasi topik lebih lanjut atau membantu pengguna mencapai tujuan mereka." },
        { text: "Jika pengguna tampak menghadapi tantangan, keraguan, atau ekspresi negatif, berikan dorongan positif, inspirasi, atau sudut pandang yang membangun. Fokus pada solusi dan potensi perkembangan." },
        { text: "Pertahankan nada bicara yang selalu positif, mendukung, dan profesional." },
        { text: "Untuk input multimodal (gambar atau dokumen), lakukan analisis mendalam terhadap konten yang dilampirkan dan integrasikan konteksnya secara cerdas ke dalam respons Anda. Jelaskan apa yang Anda pahami dari lampiran tersebut sebelum memberikan jawaban." },
        { text: "Pastikan semua fakta yang Anda sajikan akurat. Jika tidak yakin, katakan bahwa Anda tidak memiliki informasi yang cukup atau sarankan pengguna untuk mencari sumber terpercaya." },
        { text: "Saat diminta membuat daftar, selalu urutkan secara logis (misalnya berdasarkan abjad, kronologi, atau prioritas) dan gunakan penomoran atau bullet point yang rapi." },
        { text: "Hindari frasa generik seperti 'Sebagai model bahasa besar...' atau 'Saya tidak memiliki perasaan...' Fokus pada membantu pengguna secara langsung." },
        { text: "Jika diminta menulis kode, pastikan kode tersebut benar, lengkap, dan memiliki penjelasan yang memadai. Gunakan blok kode Markdown (```language\ncode\n```)." },
        { text: "Jika diminta merangkum teks yang panjang, berikan poin-poin utama secara singkat dan padat." },
        { text: "Apabila topik yang diminta di luar batas kemampuan atau pedoman Anda, tolak dengan sopan dan alihkan ke topik lain yang bisa Anda bantu." }
    ];


    try {
        const geminiModel = genAI.getGenerativeModel({ model: apiModelName });

        // Konversi riwayat percakapan agar sesuai format Gemini
        const historyForGemini = (conversationHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model', // Gemini pakai 'user' dan 'model'
            parts: [{ text: msg.content }] // Asumsi riwayat hanya berupa teks
        }));

        // Siapkan bagian-bagian pesan pengguna saat ini, termasuk file
        const currentUserMessageParts = [{ text: userMessage }];

        if (attachedFiles && attachedFiles.length > 0) {
            for (const file of attachedFiles) {
                if (file.data && file.mimeType) {
                    // Pastikan inlineData formatnya benar
                    currentUserMessageParts.push({
                        inlineData: {
                            data: file.data, 
                            mimeType: file.mimeType 
                        }
                    });
                } else {
                    console.warn('Skipping invalid attached file data:', file);
                }
            }
        }

        const chat = geminiModel.startChat({
            history: historyForGemini,
            systemInstruction: { parts: systemInstructionParts }, // Terapkan system instruction
            safetySettings: [
                // Set threshold BLOCK_NONE untuk pengujian atau jika Anda punya filter sendiri.
                // Hati-hati dengan ini di produksi tanpa filter kuat.
                {
                    category: HarmCategory.HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                {
                    category: HarmCategory.HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                {
                    category: HarmCategory.SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                {
                    category: HarmCategory.DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE, 
                },
                // --- PERBAIKAN DI SINI: MENGHAPUS KATEGORI YANG TIDAK VALID ---
                // Kategori-kategori berikut tidak didukung oleh HarmCategory standar.
                // Jika Anda ingin mengimplementasikan filtering untuk kategori ini,
                // Anda perlu melakukannya secara manual di sisi server sebelum memanggil API.
                // {
                //     category: HarmCategory.DEROGATORY,
                //     threshold: HarmBlockThreshold.BLOCK_NONE, 
                // },
                // {
                //     category: HarmCategory.TOXICITY,
                //     threshold: HarmBlockThreshold.BLOCK_NONE, 
                // },
                // {
                //     category: HarmCategory.VIOLENCE,
                //     threshold: HarmBlockThreshold.BLOCK_NONE, 
                // },
                // {
                //     category: HarmCategory.MEDICAL, 
                //     threshold: HarmBlockThreshold.BLOCK_NONE, 
                // },
                // {
                //     category: HarmCategory.FINANCE, 
                //     threshold: HarmBlockThreshold.BLOCK_NONE, 
                // },
                // --- AKHIR PERBAIKAN ---
            ],
            generationConfig: generationConfig, // Gunakan konfigurasi yang sudah disesuaikan
        });

        // Kirim pesan ke AI
        const result = await chat.sendMessage(currentUserMessageParts);
        const response = await result.response;
        const aiResponseText = response.text();

        // Mengirim respons kembali ke frontend
        // Tambahkan `modelUsed` agar frontend tahu model apa yang dipakai
        res.status(200).json({ text: aiResponseText, modelUsed: apiModelName });

    } catch (error) {
        console.error('Error in /api/generate:', error);
        let errorMessage = 'An internal server error occurred while contacting the AI model.';
        let statusCode = 500;

        if (error.response) {
            let errorDetails;
            try {
                errorDetails = await error.response.json();
            } catch (jsonParseError) {
                errorDetails = await error.response.text();
                console.error("API error response was not JSON:", errorDetails);
            }
            console.error('API Error Details:', errorDetails);

            statusCode = error.response.status;

            if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.message) {
                errorMessage = errorDetails.error.message;
            }

            if (typeof errorDetails === 'object' && errorDetails.candidates && errorDetails.candidates[0] && errorDetails.candidates[0].finishReason) {
                const finishReason = errorDetails.candidates[0].finishReason;
                if (finishReason === "SAFETY") {
                    errorMessage = "Maaf, respons ini diblokir karena tidak memenuhi pedoman keamanan.";
                } else if (finishReason === "RECITATION") {
                    errorMessage = "Respons diblokir karena terdeteksi sebagai kutipan dari sumber yang dilindungi.";
                } else if (finishReason === "OTHER") {
                    errorMessage = "Maaf, terjadi masalah saat menghasilkan respons karena alasan yang tidak spesifik.";
                }
            } else if (typeof errorDetails === 'object' && errorDetails.promptFeedback && errorDetails.promptFeedback.blockReason) {
                // Ini jika prompt pengguna sendiri yang diblokir oleh safety filter Google
                errorMessage = "Permintaan Anda diblokir sebelum diproses oleh model karena alasan keamanan. Harap sesuaikan permintaan Anda.";
                statusCode = 400; // Bad Request karena prompt tidak sesuai
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 404 && errorDetails.error.message.toLowerCase().includes("model not found")) {
                 errorMessage = `Model AI '${apiModelName}' tidak ditemukan. Mohon periksa kembali nama model di backend Anda atau pilih model lain.`;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 400 && errorDetails.error.message.toLowerCase().includes("systeminstruction not supported")) {
                errorMessage = `Model '${apiModelName}' mungkin tidak mendukung 'systemInstruction' atau formatnya salah. Coba ganti model ke yang lebih baru atau periksa systemInstruction Anda.`;
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 429) {
                errorMessage = "Batas penggunaan API tercapai. Mohon tunggu beberapa saat dan coba lagi.";
            } else if (typeof errorDetails === 'object' && errorDetails.error && errorDetails.error.code === 503) {
                errorMessage = "Layanan AI tidak tersedia. Mohon coba lagi nanti.";
            }
        } else {
            // Ini untuk error di luar respons API (misal: network error, JSON parse error)
            errorMessage = `Terjadi masalah koneksi atau server: ${error.message || 'Silakan coba lagi.'}`;
        }
        res.status(statusCode).json({ message: errorMessage });
    }
}