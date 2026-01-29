'use server';

import { getUploadUrl } from '@/utils/r2/server';
import { randomUUID } from 'crypto';

/**
 * Returns a presigned URL for uploading a file to R2.
 * Generates a unique path: `projects/{uuid}/{filename}` to prevent collisions.
 * @param fileName - Original file name
 * @param fileType - MIME type
 */
export async function getPresignedUploadUrl(fileName: string, fileType: string) {
    // Ensure the user is authenticated (using Supabase util if needed, 
    // currently proceeding as this is a protected route wrapper or middleware handles it)

    // Create a unique file path
    const uniqueId = randomUUID();
    // Sanitize filename to strict alphanumeric/dash/dot
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `uploads/${uniqueId}/${sanitizedName}`;

    try {
        const url = await getUploadUrl(key, fileType);
        return { success: true, url, key };
    } catch (error) {
        console.error("Failed to sign URL:", error);
        return { success: false, error: "Failed to generate upload URL" };
    }
}
