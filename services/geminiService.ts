import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData } from '../types';

const MODEL_NAME = 'gemini-2.5-flash-image-preview';

export async function generateTryOnImage(
    personImage: ImageData, 
    clothingItems: { top?: ImageData; trousers?: ImageData },
    apiKey: string
): Promise<string | null> {

    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
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
    
    const clothingDescription = clothingPromptParts.join(', ');

    const textPart = {
        text: `
**Task**: Virtual Try-On Image Editing.
**Objective**: Edit the first image (the person) to make them wear the provided clothing items.
**Inputs**:
- Image 1: The person to be edited.
- Subsequent Images: Clothing items to be worn (${clothingDescription}).
**CRITICAL INSTRUCTIONS**:
1.  **PRESERVE THE PERSON**: You MUST keep the original person's identity, face, facial expression, body shape, skin tone, and hair exactly as they are in the first image. Do NOT generate a new person. This is the most important rule.
2.  **PRESERVE THE POSE**: The person's pose and position in the frame must remain UNCHANGED.
3.  **PRESERVE THE BACKGROUND**: The background of the first image must be kept completely intact. Do NOT alter or replace the background.
4.  **REPLACE CLOTHING ONLY**: Your only task is to realistically place the provided clothing items onto the person in the first image, replacing what they are currently wearing.
5.  **OUTPUT**: The output must be a single, photorealistic image that is an edited version of the first image. Do not output any text.
`,
    };

    const parts = [personImagePart, ...clothingImageParts, textPart];
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        // The API can return multiple parts, we need to find the image part.
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        // If no image part is found, return null
        return null;

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        // Check if the error is a rate limit error (status 429)
        if (error.toString().includes('"code":429')) {
             throw new Error("RATE_LIMIT_EXCEEDED");
        }
        throw new Error("Failed to generate image from Gemini API.");
    }
}