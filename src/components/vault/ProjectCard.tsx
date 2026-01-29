'use client';

import Link from 'next/link';

interface Project {
    id: string;
    title: string;
    key_signature?: string | null;
    bpm?: number | null;
    cover_image_path?: string | null;
    created_at: string;
}

interface ProjectCardProps {
    project: Project;
    index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
    // Pad index for display (e.g., PRJ_01)
    const paddedIndex = String(index + 1).padStart(2, '0');

    return (
        <Link href={`/studio/${project.id}`}>
            <div className="aspect-square border border-border bg-surface hover:border-white transition-colors cursor-pointer relative flex flex-col justify-between p-4 group">

                {/* Header: ID & Status */}
                <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
                        PRJ_{paddedIndex}
                    </span>
                    {/* Minimal Status Indicator */}
                    <div className="w-1.5 h-1.5 bg-neutral-600 group-hover:bg-emerald-500 transition-colors" />
                </div>

                {/* Center: Cover Art Placeholder (Wireframe style) */}
                <div className="absolute inset-0 m-auto w-1/2 h-1/2 border border-border opacity-20 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-[1px] bg-border" />
                    <div className="h-full w-[1px] bg-border absolute" />
                </div>

                {/* Footer: Title & Data */}
                <div className="z-10 bg-surface pt-2">
                    <h3 className="font-heading text-sm text-white truncate mb-1">
                        {project.title}
                    </h3>
                    <div className="flex items-center gap-3 border-t border-border pt-2 mt-1">
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-muted uppercase font-mono">BPM</span>
                            <span className="text-[10px] text-white font-mono">{project.bpm || '---'}</span>
                        </div>
                        <div className="w-[1px] h-2 bg-border" />
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-muted uppercase font-mono">KEY</span>
                            <span className="text-[10px] text-white font-mono">{project.key_signature || '--'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
