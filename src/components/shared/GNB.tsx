import { signOut } from "@/app/actions/auth";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export async function GNB() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user profile for avatar
    let avatarUrl = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
        avatarUrl = profile?.avatar_url;
    }

    return (
        <nav className="fixed top-0 left-0 w-full h-[80px] border-b border-border bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-0 md:gap-4">
                <Link href="/" className="flex flex-col items-start gap-1 group mr-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border group-hover:border-white transition-colors flex items-center justify-center bg-surface">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={18} className="text-muted" />
                        )}
                    </div>
                    <span className="font-heading font-semibold text-lg md:text-xl tracking-tight select-none truncate">
                        LAYER & ORDER
                    </span>
                </Link>
                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted hover:text-foreground transition-colors mt-auto mb-1">
                    <Link
                        href="/vault"
                        className="text-emerald-500/80 hover:text-emerald-400 transition-all hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] px-2 py-1"
                    >
                        THE STUDIO
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Mobile Nav Link (Simplified) */}
                <div className="flex md:hidden items-center gap-4 text-xs font-mono text-muted">
                    <Link href="/vault">STUDIO</Link>
                </div>

                {/* User Info & Sign Out */}
                <div className="flex items-center gap-3 md:gap-4">
                    <form action={signOut} className="flex items-center gap-2 md:gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] md:text-xs font-mono text-white tracking-tight truncate max-w-[120px] md:max-w-none">
                                {user?.email}
                            </span>
                            <span className="text-[8px] md:text-[10px] text-emerald-500 font-mono uppercase tracking-widest">
                                Authenticated
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <button
                                type="submit"
                                title="로그아웃"
                                className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={14} />
                            </button>
                            <span className="text-[8px] font-mono text-muted uppercase">logout</span>
                        </div>
                    </form>
                </div>
            </div>
        </nav>
    );
}
