'use server'

import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
import { configureLemonSqueezy } from './client'

/**
 * Generates a checkout URL for a specific variant.
 * @param variantId - The ID of the product variant to purchase.
 * @param userEmail - (Optional) Pre-fill the user's email.
 */
export async function getCheckoutUrl(variantId: string | number, userEmail?: string) {
    configureLemonSqueezy()

    const storeId = process.env.LEMONSQUEEZY_STORE_ID

    if (!storeId) {
        throw new Error("Missing LEMONSQUEEZY_STORE_ID")
    }

    try {
        const checkout = await createCheckout(
            storeId,
            variantId,
            {
                checkoutOptions: {
                    media: false,
                    logo: true,
                },
                checkoutData: {
                    email: userEmail,
                },
            }
        )

        return checkout.data?.data.attributes.url
    } catch (error) {
        console.error("Checkout Creation Failed:", error)
        return null
    }
}
