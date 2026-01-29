import { createClient } from '@/utils/supabase/server';
import { VaultLayout } from "@/components/vault/VaultLayout";
import { redirect } from 'next/navigation';
import { ProfileEditor } from "@/components/vault/ProfileEditor";
import { ProjectRow } from "@/components/vault/ProjectRow";

export default async function MyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Fetch user projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <VaultLayout>
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
                <header className="border-b border-border pb-6">
                    <h1 className="text-3xl md:text-4xl font-heading font-light uppercase tracking-tight text-white">My Page</h1>
                    <p className="text-muted font-mono text-xs mt-2">
                        PROFILE SETTINGS // {user.email}
                    </p>
                </header>

                {/* Profile Editor Section */}
                <section>
                    <h2 className="text-xl font-heading text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Artist Profile
                    </h2>
                    <ProfileEditor profile={profile} userId={user.id} />
                </section>

                {/* My Projects Table Section */}
                <section>
                    <h2 className="text-xl font-heading text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                        My Projects
                    </h2>

                    <div className="border border-border rounded-lg overflow-hidden bg-surface/30">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-black/50 text-xs font-mono text-muted uppercase tracking-wider">
                            <div className="col-span-4 md:col-span-3">Title</div>
                            <div className="col-span-3 md:col-span-3">Artist</div>
                            <div className="col-span-2 text-center">BPM</div>
                            <div className="col-span-2 text-center">Key</div>
                            <div className="col-span-1 text-right">Time</div>
                        </div>

                        {/* Table Body */}
                        {projects && projects.length > 0 ? (
                            <div className="divide-y divide-border">
                                {projects.map((project) => (
                                    <ProjectRow key={project.id} project={project} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted font-mono text-xs">
                                No projects found in the Archive.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </VaultLayout>
    );
}


