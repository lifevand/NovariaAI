const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const { prompt, generationType, attachedFiles, selectedModel, isRegenerate } = req.body; // Tambahkan selectedModel dan isRegenerate

  if (!prompt || !generationType) {
    return res.status(400).json({ error: 'Prompt and generationType are required.' });
  }

  let modelName;
  let generationConfig = {};
  let contents = [{ role: 'user', parts: [{ text: prompt }] }];

  if (attachedFiles && attachedFiles.length > 0) {
    const fileParts = attachedFiles.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    }));
    contents[0].parts = [...fileParts, { text: prompt }];
  }

  // Gunakan selectedModel dari request body jika ada, jika tidak, fallback ke logic lama
  if (selectedModel) {
    modelName = selectedModel;
  } else {
    // Logic fallback jika selectedModel tidak ada (untuk kompatibilitas)
    switch (generationType.toLowerCase()) {
      case 'text':
        modelName = 'gemini-2.5-flash';
        generationConfig = {
          responseMimeType: 'text/plain',
        };
        break;
      case 'image':
        modelName = 'gemini-2.0-flash-preview-image-generation';
        generationConfig = {
          responseModalities: ['TEXT','IMAGE'],
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid generationType. Use "text" or "image".' });
    }
  }

  // Tambahkan safety settings untuk menghindari konten yang tidak pantas
  const safetySettings = [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ];

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents,
      generationConfig,
      safetySettings, // Tambahkan safety settings
    });
    const response = result.response;

    // Handle block reason if content is blocked
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      const blockReason = response.promptFeedback.blockReason;
      console.warn('Content blocked due to:', blockReason);
      return res.status(400).json({ 
        error: 'Respons diblokir karena melanggar kebijakan konten.', 
        details: `Alasan blokir: ${blockReason.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase()}.`
      });
    }

    if (!response.candidates || response.candidates.length === 0) {
      return res.status(404).json({ error: 'No content candidates found.' });
    }

    const firstCandidate = response.candidates[0];

    // Check for finishReason if content generation was stopped
    if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
      console.warn('Content generation stopped early with reason:', firstCandidate.finishReason);
      // Anda bisa memberikan pesan yang lebih spesifik berdasarkan finishReason jika diperlukan
    }

    if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
      return res.status(404).json({ error: 'No parts found in the first candidate.' });
    }

    const parts = firstCandidate.content.parts;

    if (generationType.toLowerCase() === 'image') {
      const images = parts.filter(part => part.inlineData).map(part => ({
        mimeType: part.inlineData?.mimeType || null,
        data: part.inlineData?.data || '',
      }));
      res.status(200).json({ images, modelUsed: modelName, text: parts.filter(part => part.text).map(part => part.text).join('\n') }); // Tambahkan teks jika ada bersama gambar
    } else {
      const text = parts.filter(part => part.text).map(part => part.text).join('\n');
      res.status(200).json({ text, modelUsed: modelName });
    }

  } catch (error) {
    console.error(`Error generating ${generationType}:`, error);
    // Lebih detail untuk penanganan error API vs error lainnya
    if (error.response && error.response.status) {
      res.status(error.response.status).json({ 
        error: `Gagal menghasilkan ${generationType}.`, 
        details: error.response.statusText || error.message,
        code: error.response.status
      });
    } else {
      res.status(500).json({ error: `Gagal menghasilkan ${generationType}.`, details: error.message });
    }
  }
};