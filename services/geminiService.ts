
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeImage = async (
  base64Data: string,
  mimeType: string,
  apiKey: string,
  colorTheme?: string,
  additionalStyle?: string
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("Gemini API Key is required to analyze images.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const refinementContext = `
    ${colorTheme ? `IMPORTANT: Enhance the description to emphasize a '${colorTheme}' color theme.` : ''}
    ${additionalStyle ? `IMPORTANT: Transform the artistic direction to follow a '${additionalStyle}' style.` : ''}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: `Analyze this image and provide a highly detailed, descriptive prompt suitable for image generation AI (like Midjourney or Stable Diffusion). 
          Include specific details about style, lighting, composition, medium, and subject.
          ${refinementContext}
          Return the data in the specified JSON format.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING, description: "The full descriptive generation prompt" },
          metadata: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING },
              subject: { type: Type.STRING },
              lighting: { type: Type.STRING },
              composition: { type: Type.STRING },
            },
            required: ["style", "subject", "lighting", "composition"],
          },
        },
        required: ["prompt", "metadata"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  return JSON.parse(text) as AnalysisResult;
};
