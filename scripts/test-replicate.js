
const Replicate = require('replicate');
require('dotenv').config({ path: '.env.local' });

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function testMastering() {
    console.log("--- Testing Mastering (Audio Super Resolution) ---");
    try {
        // FIX: model.get takes owner and name as separate arguments
        console.log("Fetching model version...");
        const model = await replicate.models.get("nateraw", "audio-super-resolution");
        const version = model.latest_version.id;
        console.log("Latest Version:", version);

        console.log("Creating prediction...");
        const prediction = await replicate.predictions.create({
            version: version,
            input: {
                input_file: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav", // Public test audio
                ddim_steps: 20 // Lower steps for faster test
            }
        });

        console.log("Prediction created:", prediction.id);
        console.log("Status:", prediction.status);

        // Simple polling for test
        let result = prediction;
        while (result.status !== 'succeeded' && result.status !== 'failed') {
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 2000));
            result = await replicate.predictions.get(prediction.id);
        }
        console.log("\nResult Status:", result.status);
        if (result.status === 'failed') console.error("Error:", result.error);
        else console.log("Output:", result.output);

    } catch (error) {
        console.error("Mastering Test Failed:", error);
    }
}

async function testStems() {
    console.log("\n--- Testing Stem Separation (htdemucs) ---");
    try {
        // model: cjwbw/demucs
        const modelVersion = "cfa93589a24afc8a8e4cc2e7aade3c2f5961a9fb987c991e4a7d1e820d0e2b2f";

        console.log("Creating prediction...");
        const prediction = await replicate.predictions.create({
            version: modelVersion,
            input: {
                audio: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
                output_format: "mp3"
            }
        });

        console.log("Prediction created:", prediction.id);

        let result = prediction;
        while (result.status !== 'succeeded' && result.status !== 'failed') {
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 2000));
            result = await replicate.predictions.get(prediction.id);
        }
        console.log("\nResult Status:", result.status);
        if (result.status === 'failed') console.error("Error:", result.error);
        else console.log("Output:", result.output);

    } catch (error) {
        console.error("Stems Test Failed:", error);
    }
}

async function run() {
    await testMastering();
    await testStems();
}

run();
