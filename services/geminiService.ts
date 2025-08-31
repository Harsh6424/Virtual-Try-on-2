import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData } from '../types';

const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image-preview';

export async function generateTryOnImage(
    apiKey: string,
    personImage: ImageData, 
    clothingItems: { top?: ImageData; trousers?: ImageData }
): Promise<string | null> {
    
    if (!apiKey) {
        throw new Error("INVALID_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey });

    const personImagePart = {
        inlineData: {
            data: personImage.base64,
            mimeType: personImage.mimeType,
        },
    };

    const clothingImageParts = [];
    const clothingPromptParts = [];

    if (clothingItems.top) {
        clothingImageParts.push({
            inlineData: { data: clothingItems.top.base64, mimeType: clothingItems.top.mimeType },
        });
        clothingPromptParts.push("a top");
    }
    if (clothingItems.trousers) {
        clothingImageParts.push({
            inlineData: { data: clothingItems.trousers.base64, mimeType: clothingItems.trousers.mimeType },
        });
        clothingPromptParts.push("trousers");
    }
    
    const clothingDescription = clothingPromptParts.join(' and ');

    const textPart = {
        text: `
You are a world-class fashion AI stylist. Your task is to perform a virtual try-on.
Your objective is to edit the first image (the person) to make them wear the provided clothing item(s): ${clothingDescription}.

**CRITICAL RULES**:
1.  **PRESERVE THE PERSON**: You MUST keep the original person's identity, face, expression, body shape, skin tone, and hair exactly as they are. DO NOT generate a new person. This is the most important rule.
2.  **PRESERVE THE POSE**: The person's pose and position must remain UNCHANGED.
3.  **PRESERVE THE BACKGROUND**: The background of the first image must be kept completely intact. DO NOT alter or replace it.
4.  **REPLACE CLOTHING ONLY**: Your only job is to realistically place the provided clothing onto the person, replacing what they are currently wearing.
5.  **OUTPUT A SINGLE IMAGE**: The final output must be a single, photorealistic image that is an edited version of the first image. Do not output text, just the final image.
`,
    };

    const parts = [personImagePart, ...clothingImageParts, textPart];
    
    try {
        const response = await ai.models.generateContent({
            model: IMAGE_EDIT_MODEL,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;

    } catch (error: any) {
        console.error("Error calling Gemini API for image generation:", error);
        const errorMessage = error.toString();
        if (errorMessage.includes('API key not valid')) {
            throw new Error("INVALID_API_KEY");
        }
        if (errorMessage.includes('"code":429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
             throw new Error("RATE_LIMIT_EXCEEDED");
        }
        throw new Error("Failed to generate image from Gemini API.");
    }
}
