import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

export function configureLemonSqueezy() {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY

    if (!apiKey) {
        console.warn("LemonSqueezy API Key not found. Skipping configuration.")
        return
    }

    lemonSqueezySetup({
        apiKey,
        onError: (error) => console.error("LemonSqueezy Error:", error),
    })
}
