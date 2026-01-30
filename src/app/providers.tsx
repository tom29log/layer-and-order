'use client';

import { AudioProvider } from '@/contexts/AudioProvider';
import { PageTransition } from '@/components/shared/PageTransition';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <AudioProvider>
            <PageTransition>
                {children}
            </PageTransition>
        </AudioProvider>
    );
}
