'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

interface StemSeparationResult {
    success: boolean;
    error?: string;
    predictionId?: string;
    status?: string;
    stems?: {
        vocals: string;
        drums: string;
        bass: string;
        other: string;
    };
    isMock?: boolean;
}

export async function separateStems(
    projectId: string,
    audioUrl: string
): Promise<StemSeparationResult> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check if REPLICATE_API_TOKEN is configured
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    if (!replicateToken) {
        console.log('REPLICATE_API_TOKEN not configured, using mock mode');

        // Mock mode: Return the original audio as all stems (for demo)
        return {
            success: true,
            isMock: true,
            stems: {
                vocals: audioUrl,
                drums: audioUrl,
                bass: audioUrl,
                other: audioUrl,
            }
        };
    }

    try {
        // 1. Get latest version of Demucs
        console.log("Fetching Demucs model version...");
        let modelVersion = '';
        try {
            const model = await replicate.models.get("cjwbw", "demucs");
            modelVersion = model.latest_version?.id || "cfa93589a24afc8a8e4cc2e7aade3c2f5961a9fb987c991e4a7d1e820d0e2b2f";
        } catch (e) {
            console.error("Failed to fetch Demucs version:", e);
            modelVersion = "cfa93589a24afc8a8e4cc2e7aade3c2f5961a9fb987c991e4a7d1e820d0e2b2f";
        }

        console.log("Starting Stem Separation with Model:", modelVersion);
        console.log("Audio URL (first 50 chars):", audioUrl.substring(0, 50));

        // Call Replicate API
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait',
            },
            body: JSON.stringify({
                version: modelVersion,
                input: {
                    audio: audioUrl,
                    output_format: 'mp3',
                    model_name: "htdemucs"
                }
            }),
        });

        console.log('Stem Separation Request:', {
            url: 'https://api.replicate.com/v1/predictions',
            audioUrl: audioUrl,
            tokenPrefix: replicateToken.substring(0, 5) + '...'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Replicate API error:', JSON.stringify(errorData, null, 2));
            return { success: false, error: `Stem separation failed: ${response.statusText}` };
        }

        const prediction = await response.json();

        // Return immediately with prediction ID so client can poll
        return {
            success: true,
            predictionId: prediction.id,
            status: prediction.status
        };

    } catch (error) {
        console.error('Stem separation error:', error);
        return { success: false, error: 'Failed to separate stems' };
    }
}

export async function checkStemStatus(predictionId: string): Promise<StemSeparationResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) return { success: false, error: 'Server configuration error' };

    try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return { success: false, error: 'Failed to check status' };
        }

        const prediction = await response.json();

        if (prediction.status === 'succeeded') {
            return {
                success: true,
                status: 'succeeded',
                stems: {
                    vocals: prediction.output?.vocals || '',
                    drums: prediction.output?.drums || '',
                    bass: prediction.output?.bass || '',
                    other: prediction.output?.other || '',
                }
            };
        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
            return { success: false, error: `Separation ${prediction.status}: ${prediction.error}` };
        } else {
            return { success: true, status: prediction.status }; // Still processing
        }

    } catch (error) {
        console.error('Status check error:', error);
        return { success: false, error: 'Failed to check status' };
    }
}

import { uploadToR2 } from '@/utils/r2/server';

export async function saveSeparatedStems(
    projectId: string,
    stems: { vocals: string; drums: string; bass: string; other: string }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const stemTypes = ['vocals', 'drums', 'bass', 'other'];
        const savedStems = [];

        for (const type of stemTypes) {
            const url = stems[type as keyof typeof stems];
            if (!url) continue;

            console.log(`Downloading ${type} from ${url}...`);

            // 1. Download from Replicate
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to download ${type}`);
            const blob = await response.blob();
            const buffer = Buffer.from(await blob.arrayBuffer());

            // 2. Upload to R2
            const fileName = `${type}_${Date.now()}.mp3`;
            const r2Path = `${user.id}/${projectId}/stems/${fileName}`;

            await uploadToR2(r2Path, buffer, 'audio/mpeg');

            // 3. Save to DB
            savedStems.push({
                project_id: projectId,
                name: `${type.charAt(0).toUpperCase() + type.slice(1)} (AI)`,
                // stem_type: type, // Column does not exist in DB schema
                file_path: r2Path,
                file_size: buffer.length,
                file_type: 'audio/mpeg'
            });
        }

        if (savedStems.length > 0) {
            const { error } = await supabase.from('stems').insert(savedStems);
            if (error) throw error;
        }

        revalidatePath(`/studio/${projectId}`);
        return { success: true };

    } catch (error) {
        console.error('Save stems error:', error);
        return { success: false, error: `Failed to save stems: ${JSON.stringify(error)}` };
    }
}
