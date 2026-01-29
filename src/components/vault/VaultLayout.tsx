export function VaultLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen pt-[60px] bg-grid">
            <main className="container-max py-8 relative">
                {children}
            </main>
        </div>
    );
}
