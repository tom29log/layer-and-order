'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { updateProjectTitle } from '@/app/actions/profile';
import Link from 'next/link';

interface ProjectRowProps {
    project: any;
}

export function ProjectRow({ project }: ProjectRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(project.title);
    const [tempTitle, setTempTitle] = useState(project.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleEdit = () => {
        setTempTitle(title);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!tempTitle.trim()) return;

        // Optimistic update
        setTitle(tempTitle);
        setIsEditing(false);

        // Server Action
        await updateProjectTitle(project.id, tempTitle);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    return (
        <div className="grid grid-cols-12 gap-4 py-2 px-4 items-center hover:bg-white/5 transition-colors group border-b border-border/50 last:border-0">
            {/* Title Column */}
            <div className="col-span-4 md:col-span-3 flex items-center gap-2">
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            ref={inputRef}
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-black border border-emerald-500 text-sm px-2 py-1 focus:outline-none"
                        />
                        <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-400"><Check size={14} /></button>
                        <button onClick={handleCancel} className="text-red-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                        <Link href={`/studio/${project.id}`} className="font-medium text-white text-sm hover:text-emerald-500 truncate transition-colors">
                            {title}
                        </Link>
                        <button
                            onClick={handleEdit}
                            className="opacity-0 group-hover:opacity-100 text-muted hover:text-white transition-opacity p-1"
                            title="Edit Title"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Artist Column */}
            <div className="col-span-3 md:col-span-3 text-sm text-neutral-400 truncate font-mono">
                {project.artist || '-'}
            </div>

            {/* BPM */}
            <div className="col-span-2 text-center text-xs font-mono text-muted">
                {project.bpm || '-'}
            </div>

            {/* Key */}
            <div className="col-span-2 text-center text-xs font-mono text-muted">
                {project.key_signature || '-'}
            </div>

            {/* Time (Mocked for now as we don't store duration yet) */}
            <div className="col-span-1 text-right text-xs font-mono text-muted">
                {/* Random duration for display if not available */}
                03:45
            </div>
        </div>
    );
}
