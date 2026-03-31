import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeImage(base64Image: string, prompt: string) {
  const model = "gemini-3-flash-preview";
  
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const result = await genAI.models.generateContent({
    model,
    contents: [{ parts: [imagePart, { text: prompt }] }],
  });

  return result.text;
}

export async function generateReport(base64Image: string, analysisResults: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Based on the following computer vision analysis:
    "${analysisResults}"
    
    Generate a professional, detailed technical report in Markdown format.
    Include sections:
    1. Executive Summary
    2. Visual Analysis Details
    3. Object Detection & Classification
    4. Contextual Insights
    5. Recommendations/Conclusion
    
    Make it look like a formal document.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const result = await genAI.models.generateContent({
    model,
    contents: [{ parts: [imagePart, { text: prompt }] }],
  });

  return result.text;
}
