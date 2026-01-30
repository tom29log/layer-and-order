export default function VaultLoading() {
    return (
        <div className="min-h-screen p-4 md:p-8 pt-24 animate-pulse">
            {/* Header Skeleton */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="h-8 w-48 bg-surface rounded mb-2" />
                <div className="h-4 w-32 bg-surface/50 rounded" />
            </div>

            {/* Grid Skeleton */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="aspect-square bg-surface border border-border rounded-lg p-6 flex flex-col justify-between"
                    >
                        {/* Top */}
                        <div>
                            <div className="h-5 w-3/4 bg-white/5 rounded mb-2" />
                            <div className="h-3 w-1/2 bg-white/5 rounded" />
                        </div>

                        {/* Waveform Placeholder */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-end gap-1 h-12">
                                {[...Array(20)].map((_, j) => (
                                    <div
                                        key={j}
                                        className="w-1 bg-white/10 rounded-full"
                                        style={{
                                            height: `${Math.random() * 100}%`,
                                            animationDelay: `${j * 50}ms`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Bottom */}
                        <div className="flex justify-between items-center">
                            <div className="h-3 w-16 bg-white/5 rounded" />
                            <div className="h-8 w-8 bg-white/5 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
