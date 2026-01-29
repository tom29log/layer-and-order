
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

console.log('--- Testing R2 Configuration ---');
console.log('Account ID:', R2_ACCOUNT_ID ? 'Set' : 'Missing');
console.log('Access Key:', R2_ACCESS_KEY_ID ? 'Set' : 'Missing');
console.log('Secret Key:', R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing');
console.log('Bucket Name:', R2_BUCKET_NAME);

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('❌ Missing R2 environment variables!');
    process.exit(1);
}

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

async function testUpload() {
    try {
        const testKey = `test-upload-${Date.now()}.txt`;
        console.log(`\nAttempting to upload ${testKey} to ${R2_BUCKET_NAME}...`);

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: testKey,
            Body: 'This is a test file to verify R2 write permissions.',
            ContentType: 'text/plain',
        });

        await r2Client.send(command);
        console.log('✅ Upload successful!');
        console.log(`File: ${testKey}`);

    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        if (error.name) console.error('Error Name:', error.name);
        if (error.$metadata) console.error('Metadata:', error.$metadata);
    }
}

testUpload();
