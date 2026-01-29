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

        // 1. Get the latest version of the Audio Super Resolution model
        // Using nateraw/audio-super-resolution for "Mastering" (Enhancement)
        let modelVersion = '';
        try {
            const model = await replicate.models.get("nateraw", "audio-super-resolution");
            modelVersion = model.latest_version?.id || "0e453d5e4c2e0ef4f8d38a6167053dda09cf3c8dbca2355cde61dca55a915bc5"; // Known good hash
        } catch (e) {
            console.error("Failed to fetch model version, using fallback:", e);
            modelVersion = "0e453d5e4c2e0ef4f8d38a6167053dda09cf3c8dbca2355cde61dca55a915bc5"; // Fallback to known hash
        }

        console.log('Starting Mastering with Model:', modelVersion);

        // 2. Create Prediction
        const prediction = await replicate.predictions.create({
            version: modelVersion,
            input: {
                input_file: inputUrl,
                ddim_steps: 50, // Default steps for good quality
            },
        });

        // 3. Poll for Completion (Max 5 minutes)
        let result = prediction;
        const maxAttempts = 60; // 60 * 5s = 5 min

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));

            result = await replicate.predictions.get(prediction.id);

            if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
                break;
            }
        }

        if (result.status !== 'succeeded') {
            return { error: `Mastering failed or timed out: ${result.error || result.status}` };
        }

        return {
            success: true,
            predictionId: result.id,
            status: result.status,
            output: result.output
        };

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
