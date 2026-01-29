import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/vault'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Robustly determine the redirect URL
            // This fixes issues where 'origin' header might be missing or localhost in proxies/apps
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
                process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
                'http://localhost:3000/'

            // Format URL correctly
            let finalUrl = siteUrl.includes('http') ? siteUrl : `https://${siteUrl}`
            finalUrl = finalUrl.charAt(finalUrl.length - 1) === '/' ? finalUrl : `${finalUrl}/`

            // Construct the absolute URL for the next page
            // Remove leading slash from 'next' if existing to double slash
            const cleanNext = next.startsWith('/') ? next.substring(1) : next;

            return NextResponse.redirect(`${finalUrl}${cleanNext}`)
        }
    }

    // return the user to an error page with instructions
    // Fallback to origin if we fail, but ideally should use siteUrl here too
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
