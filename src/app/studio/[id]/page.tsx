import { createClient } from '@/utils/supabase/server';
import { VaultLayout } from "@/components/vault/VaultLayout";
import { StudioContainer } from "@/components/studio/StudioContainer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getDownloadUrl } from '@/utils/r2/server';

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Parallel fetch for speed without aggressive caching
    const [projectResult, stemsResult] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('stems').select('*').eq('project_id', id)
    ]);

    const project = projectResult.data;
    const stems = stemsResult.data;

    if (!project) {
        notFound();
    }

    // Generate download URLs in parallel
    let originalAudioUrl = undefined;
    let stemsWithUrls: any[] = [];

    if (stems && stems.length > 0) {
        // Use standard Promise.all for URLs
        const urlPromises = stems.map(stem => getDownloadUrl(stem.file_path));
        const urls = await Promise.all(urlPromises);

        originalAudioUrl = urls[0];
        stemsWithUrls = stems.map((stem, i) => ({
            ...stem,
            url: urls[i]
        }));
    }

    return (
        <VaultLayout>
            <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <Link href="/vault" className="inline-flex items-center gap-2 text-white hover:text-[#FF5F1F] font-mono text-sm mb-4 transition-colors">
                            <ArrowLeft size={14} />
                            EXIT_STUDIO
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-heading font-light uppercase tracking-tighter text-white">
                            {project.title}
                        </h1>
                        <p className="text-muted font-mono text-xs mt-2 uppercase tracking-widest">
                            Studio Configuration // Select Service
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-mono text-muted">BPM: {project.bpm || 'N/A'}</p>
                        <p className="text-xs font-mono text-muted">KEY: {project.key_signature || 'N/A'}</p>
                    </div>
                </div>

                <StudioContainer
                    projectId={project.id}
                    originalAudioUrl={originalAudioUrl}
                    stems={stemsWithUrls}
                />
            </div>
        </VaultLayout>
    );
}
