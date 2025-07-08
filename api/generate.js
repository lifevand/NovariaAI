import { GoogleGenerativeAI } from '@google/genai';
import mime from 'mime'; // <--- Jika ini tidak dipakai, hapus saja.

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const { prompt, generationType, attachedFiles } = req.body;

  if (!prompt || !generationType) {
    return res.status(400).json({ error: 'Prompt and generationType are required.' });
  }

  let modelName;
  let generationConfig = {};
  let contents = [{ role: 'user', parts: [{ text: prompt }] }];

  // Ini bagian yang menangani file yang dilampirkan
  if (attachedFiles && attachedFiles.length > 0) {
    const fileParts = attachedFiles.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    }));
    contents[0].parts = [...fileParts, { text: prompt }];
  }

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
        responseModalities: ['IMAGE'],
      };
      break;
    default:
      return res.status(400).json({ error: 'Invalid generationType. Use "text" or "image".' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents,
      generationConfig,
    });
    const response = result.response;

    if (!response.candidates || response.candidates.length === 0) {
      return res.status(404).json({ error: 'No content candidates found.' });
    }

    const firstCandidate = response.candidates[0];

    if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
      return res.status(404).json({ error: 'No parts found in the first candidate.' });
    }

    const parts = firstCandidate.content.parts;

    if (generationType.toLowerCase() === 'image') {
      const images = parts.filter(part => part.inlineData).map(part => ({
        mimeType: part.inlineData?.mimeType || null,
        data: part.inlineData?.data || '',
      }));
      res.status(200).json({ images, modelUsed: modelName });
    } else {
      const text = parts.filter(part => part.text).map(part => part.text).join('\n');
      res.status(200).json({ text, modelUsed: modelName });
    }

  } catch (error) {
    console.error(`Error generating ${generationType}:`, error);
    res.status(500).json({ error: `Failed to generate ${generationType}.`, details: error.message });
  }
}