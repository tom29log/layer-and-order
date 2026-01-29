import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { configureLemonSqueezy } from "@/utils/lemonsqueezy/client";

export async function POST(request: NextRequest) {
    configureLemonSqueezy();

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
        return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    // Get the raw body
    const rawBody = await request.text();

    // Get the signature from headers
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(request.headers.get("X-Signature") || "", "utf8");

    // Verify signature
    if (!crypto.timingSafeEqual(digest, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    console.log("LemonSqueezy Webhook Received:", eventName);

    // Handle events (Placeholder for future DB logic)
    switch (eventName) {
        case "subscription_created":
        case "subscription_updated":
        case "subscription_cancelled":
            // TODO: Update user subscription status in Supabase
            console.log("Processing subscription event:", payload.data.id);
            break;
        default:
            console.log("Unhandled event:", eventName);
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
