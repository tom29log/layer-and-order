'use server';

import Replicate from 'replicate';
import { createClient } from '@/utils/supabase/server';

// Initialize Replicate conditionally to avoid crashes if token is missing
const getReplicateClient = () => {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return null;
    return new Replicate({ auth: token });
};

export async function startMastering(projectId: string, inputUrl: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check Authentication
    if (!user) {
        console.error("Mastering Action: User not authenticated.");
        return { error: 'Unauthorized: Please log in again.' };
    }

    try {
        const replicate = getReplicateClient();

        // ---------------------------------------------------------
        // MOCK MODE: If no API Token, simulate success for UI testing
        // ---------------------------------------------------------
        if (!replicate) {
            console.warn("Replicate API Token missing. Running in MOCK MODE.");

            // Simulate processing delay (e.g., 5 seconds)
            await new Promise(resolve => setTimeout(resolve, 5000));

            return {
                success: true,
                predictionId: 'mock-prediction-id',
                status: 'succeeded',
                isMock: true,
                output: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'
            };
        }

        // ---------------------------------------------------------
        // REAL MODE: Call Replicate API
        // ---------------------------------------------------------

        // NOTE: Replace with actual Mastering Model
        // For MVP, using a music generation model as placeholder since no public mastering model is standard.
        const modelVersion = "7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573507960"; // meta/musicgen

        const prediction = await replicate.predictions.create({
            version: modelVersion,
            input: {
                prompt: "mastering, studio quality, premium sound",
                model_version: "stereo-large",
                // audio: inputUrl // Real model would take audio input
            },
        });

        return { success: true, predictionId: prediction.id, status: prediction.status };

    } catch (error) {
        console.error("Mastering failed:", error);
        return { error: 'Failed to start mastering process. Please check server logs.' };
    }
}

export async function checkMasteringStatus(predictionId: string) {
    // MOCK MODE Handling
    if (predictionId === 'mock-prediction-id') {
        return {
            status: 'succeeded',
            output: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', // Sample audio
            error: null
        };
    }

    const replicate = getReplicateClient();
    if (!replicate) return { error: 'Replicate client not initialized' };

    const prediction = await replicate.predictions.get(predictionId);
    return {
        status: prediction.status,
        output: prediction.output,
        error: prediction.error
    };
}
