import { createClient } from '@/utils/supabase/server';
import { VaultLayout } from "@/components/vault/VaultLayout";
import { ProjectCard } from "@/components/vault/ProjectCard";
import { EmptyState } from "@/components/vault/EmptyState";
import Link from 'next/link';
import { User, Settings } from 'lucide-react';

export default async function VaultPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
    }

    return (
        <VaultLayout>
            <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                {/* Profile Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} className="text-muted" />
                            )}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-heading font-light uppercase tracking-tight text-white truncate">
                                {profile?.nickname || user?.email?.split('@')[0] || 'GUEST'}
                            </h1>
                            <p className="text-muted font-mono text-xs mt-1 line-clamp-2">
                                {profile?.bio || 'No bio yet...'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`w-2 h-2 rounded-full ${profile?.is_pro ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
                                    {profile?.is_pro ? 'PRO' : 'FREE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                        <Link href="/vault/new">
                            <button className="h-10 px-6 border border-emerald-500 bg-emerald-500/10 text-emerald-500 text-xs font-mono hover:bg-emerald-500 hover:text-black transition-colors uppercase flex items-center gap-2">
                                <span>+</span> New Project
                            </button>
                        </Link>
                        <Link href="/vault/me">
                            <button className="h-10 px-6 border border-border bg-surface text-xs font-mono hover:bg-white hover:text-black transition-colors uppercase flex items-center gap-2">
                                <Settings size={14} />
                                My Page
                            </button>
                        </Link>
                    </div>
                </header>

                {/* Projects Title */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-heading font-light uppercase tracking-tight text-white">My Projects</h2>
                    <span className="font-mono text-xs text-muted">{projects?.length || 0} ITEMS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Real Data Rendering */}
                    {projects && projects.length > 0 ? (
                        projects.map((project, i) => (
                            <ProjectCard key={project.id} project={project} index={i} />
                        ))
                    ) : (
                        <div className="col-span-full">
                            <EmptyState />
                        </div>
                    )}
                </div>
            </div>
        </VaultLayout>
    );
}

