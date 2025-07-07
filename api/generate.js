import { GoogleGenerativeAI } from '@google/genai';

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const { prompt, generationType } = req.body;

  if (!prompt || !generationType) {
    return res.status(400).json({ error: 'Prompt and generationType are required.' });
  }

  let model;
  let generationConfig = {};
  let contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  switch (generationType.toLowerCase()) {
    case 'text':
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      generationConfig = {
        responseMimeType: 'text/plain',
      };
      break;
    case 'image':
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
      generationConfig = {
        responseModalities: ['IMAGE'],
      };
      break;
    default:
      return res.status(400).json({ error: 'Invalid generationType. Use "text" or "image".' });
  }

  try {
    const result = await model.generateContent({
      contents,
      generationConfig,
    });
    const response = result.response;

    if (!response.candidates || response.candidates.length === 0) {
      return res.status(404).json({ error: 'No content candidates found.' });
    }

    const firstCandidate = response.candidates?[0];

    if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
      return res.status(404).json({ error: 'No parts found in the first candidate.' });
    }

    const parts = firstCandidate.content.parts;

    if (generationType.toLowerCase() === 'image') {
      const images = parts.filter(part => part.inlineData).map(part => ({
        mimeType: part.inlineData?.mimeType || null,
        data: part.inlineData?.data || '',
      }));
      res.status(200).json({ images });
    } else {
      const text = parts.filter(part => part.text).map(part => part.text).join('\n');
      res.status(200).json({ text });
    }

  } catch (error) {
    console.error(`Error generating ${generationType}:`, error);
    res.status(500).json({ error: `Failed to generate ${generationType}.`, details: error.message });
  }
}