'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface StemSeparationResult {
    success: boolean;
    error?: string;
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
        // Call Replicate API for stem separation (htdemucs model)
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait', // Wait for the prediction to complete
            },
            body: JSON.stringify({
                version: 'cfa93589a24afc8a8e4cc2e7aade3c2f5961a9fb987c991e4a7d1e820d0e2b2f', // htdemucs
                input: {
                    audio: audioUrl,
                    stem: 'all', // Get all stems
                    output_format: 'mp3',
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Replicate API error:', errorData);
            return { success: false, error: 'Stem separation failed' };
        }

        const prediction = await response.json();

        // Handle async prediction (if not completed immediately)
        if (prediction.status === 'starting' || prediction.status === 'processing') {
            // Poll for completion
            let result = prediction;
            for (let i = 0; i < 60; i++) { // Max 5 minutes (60 * 5s)
                await new Promise(resolve => setTimeout(resolve, 5000));

                const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                    headers: { 'Authorization': `Bearer ${replicateToken}` }
                });
                result = await pollResponse.json();

                if (result.status === 'succeeded') break;
                if (result.status === 'failed') {
                    return { success: false, error: 'Stem separation failed' };
                }
            }

            if (result.status !== 'succeeded') {
                return { success: false, error: 'Timeout waiting for stem separation' };
            }

            return {
                success: true,
                stems: {
                    vocals: result.output?.vocals || '',
                    drums: result.output?.drums || '',
                    bass: result.output?.bass || '',
                    other: result.output?.other || '',
                }
            };
        }

        // If prediction completed immediately
        if (prediction.status === 'succeeded') {
            return {
                success: true,
                stems: {
                    vocals: prediction.output?.vocals || '',
                    drums: prediction.output?.drums || '',
                    bass: prediction.output?.bass || '',
                    other: prediction.output?.other || '',
                }
            };
        }

        return { success: false, error: 'Unexpected response from Replicate' };

    } catch (error) {
        console.error('Stem separation error:', error);
        return { success: false, error: 'Failed to separate stems' };
    }
}
