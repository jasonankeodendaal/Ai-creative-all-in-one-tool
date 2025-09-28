import { GoogleGenAI } from "@google/genai";
import { UploadedImage } from '../types.ts';

let ai: GoogleGenAI | null = null;

// Lazily initialize the AI instance to avoid crashing the app on load
// if the API key is not yet set.
const getAi = (): GoogleGenAI => {
    // Fix: Use Vite's standard `import.meta.env` for client-side environment variables.
    // The variable MUST be prefixed with VITE_ to be exposed to the browser.
    if (!import.meta.env.VITE_API_KEY) {
        // Fix: Update error message to reference VITE_API_KEY.
        throw new Error("VITE_API_KEY environment variable is not set. Please configure it in your Vercel deployment settings.");
    }
    if (!ai) {
        // Fix: Initialize with API key from environment variable.
        ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    }
    return ai;
};


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            if (result) {
                resolve(result);
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

interface BusinessDetails {
    companyName: string;
    tel: string;
    email: string;
}

export const generateVideo = async (
    stylePrompt: string, 
    details: BusinessDetails, 
    images: UploadedImage[],
    logoWasAdded: boolean,
    duration: string,
    bibleInstructions?: string,
    aspectRatio: string = '16:9'
): Promise<string> => {
    const aiInstance = getAi(); // Get or initialize the AI instance

    if (images.length === 0) {
        throw new Error("At least one image is required to generate a video.");
    }
    
    const systemInstruction = `
    **Core Directives for Video Generation:**
    1.  **Ultra-Realism is Paramount:** Your highest priority is to generate a video that is indistinguishable from high-quality, professionally shot footage. Avoid any style that looks synthetic, artificial, or obviously AI-generated. Prioritize photorealism, natural lighting, and authentic textures to maintain a feeling of 'realness'.
    2.  **Act as an Expert Creative Director:** Do not just animate images. Analyze the user's prompt, company details, and brand bible to create a compelling, cohesive narrative for the advertisement. The ad should tell a story and have a clear beginning, middle, and end.
    3.  **Flawless Text and Graphics:** All text overlays, pop-ups, or graphics displayed in the video must be perfectly spelled, grammatically correct, and visually professional. Double-check all text content for errors.
    4.  **Commercial-Grade Quality:** The output must be a polished, professional, commercial-ready video ad suitable for high-stakes marketing campaigns.
    `;
    
    // Construct the final prompt
    let finalPrompt = systemInstruction;

    if (bibleInstructions) {
        finalPrompt += `\n**Brand Guidelines (CRITICAL: Strict Adherence Required):**\n---\n${bibleInstructions}\n---\n`;
    }

    finalPrompt += `\n**Ad Brief:**\nCreate an advertisement based on the following style: ${stylePrompt}.`;
    
    if (images.length > 1) {
        finalPrompt += ` The user has provided ${images.length} reference images to serve as inspiration for the video's content and narrative. Your goal is to create a single, cohesive video that incorporates the themes, products, or scenes from ALL the provided images. The first image is passed to you as the primary visual and style reference, but the final video must feel like a comprehensive representation of the entire set of images. Animate transitions between scenes inspired by each image.`;
    }

    finalPrompt += `\n**CRITICAL FORMATTING:** The video's aspect ratio MUST be ${aspectRatio}. You must adapt the entire composition, animations, and text placement to perfectly fit this format. Do not simply crop; re-imagine the scene for the specified dimension.`;

    finalPrompt += `\n**VIDEO DURATION (CRITICAL):** The video's total runtime must be exactly ${duration}. Do not deviate from this length.`;
    
    if (details.companyName) {
        finalPrompt += ` This ad is for the company '${details.companyName}'.`;
    }
    if (logoWasAdded) {
        finalPrompt += ` The primary reference image contains the company logo. Incorporate this logo tastefully into the video, for example as a watermark or in the intro/outro sequence.`;
    }
    if (details.tel || details.email) {
        finalPrompt += ` Display the following contact information prominently and clearly in the video:`;
        if (details.tel) finalPrompt += ` Phone: ${details.tel}`;
        if (details.tel && details.email) finalPrompt += `,`;
        if (details.email) finalPrompt += ` Email: ${details.email}`;
        finalPrompt += `.`;
    }
    finalPrompt += ` The final video should be a full, unmuted advertisement with animated popups that follow all the core directives.`;

    try {
        const firstImage = images[0].file;
        const base64Image = await fileToBase64(firstImage);
        
        console.log("Starting video generation with prompt:", finalPrompt);

        let operation = await aiInstance.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: finalPrompt,
            image: {
                imageBytes: base64Image,
                mimeType: firstImage.type,
            },
            config: {
                numberOfVideos: 1
            }
        });

        console.log("Polling for video generation status...");

        const startTime = Date.now();
        // Set a 30-minute timeout, as video generation can be a lengthy process.
        const timeout = 30 * 60 * 1000;

        while (!operation?.done) {
            if (Date.now() - startTime > timeout) {
                throw new Error("Video generation timed out after 30 minutes. This can happen with very complex requests. Please try again with a simpler prompt.");
            }
            
            await new Promise(resolve => setTimeout(resolve, 10000));

            try {
                operation = await aiInstance.operations.getVideosOperation({ operation: operation });
                console.log("Polling status:", operation?.done);
            } catch (pollError) {
                console.error("Error during polling for video status:", pollError);
                throw new Error("Failed to retrieve video generation status. The process may have been interrupted.");
            }
        }

        console.log("Video generation complete.");

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Failed to retrieve video download link.");
        }

        console.log("Fetching generated video...");
        // Fix: Use Vite's `import.meta.env` to access the environment variable.
        const response = await fetch(`${downloadLink}&key=${import.meta.env.VITE_API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        console.log("Video URL created:", videoUrl);
        return videoUrl;

    } catch (error) {
        console.error("Error generating video:", error);
        
        let detailedMessage = "An unknown error occurred during video generation.";

        if (error instanceof Error) {
            // Check for the specific error from getAi()
            // Fix: Check for the updated error message.
            if (error.message.startsWith("VITE_API_KEY environment variable is not set")) {
                throw error;
            }

            try {
                const parsedError = JSON.parse(error.message);
                if (parsedError.error && parsedError.error.message) {
                    detailedMessage = parsedError.error.message;
                } else {
                    detailedMessage = error.message;
                }
            } catch (e) {
                detailedMessage = error.message;
            }
        }

        if (detailedMessage.toLowerCase().includes('quota exceeded') || detailedMessage.toLowerCase().includes('resource_exhausted')) {
            throw new Error("API quota exceeded. Please check your Gemini API account for details on your usage limits and when they reset.");
        }

        throw new Error(`Video generation failed: ${detailedMessage}`);
    }
};