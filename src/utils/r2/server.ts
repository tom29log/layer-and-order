import 'server-only';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
// const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Generates a presigned URL for uploading a file to R2.
 * @param key - The file path/name in the bucket
 * @param contentType - The MIME type of the file
 * @param expiresIn - Expiration time in seconds (default 3600)
 */
export async function getUploadUrl(key: string, contentType: string, expiresIn = 3600) {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generates a presigned URL for downloading/viewing a file from R2.
 * Use this for private files.
 * @param key - The file path/name in the bucket
 * @param expiresIn - Expiration time in seconds (default 3600)
 */
export async function getDownloadUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}
