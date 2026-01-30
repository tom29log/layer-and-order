export default function StudioLoading() {
    return (
        <div className="min-h-screen p-4 md:p-8 pt-24 animate-pulse">
            <div className="max-w-6xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-4 w-24 bg-surface rounded mb-4" />
                    <div className="h-10 w-64 bg-surface rounded mb-2" />
                    <div className="h-4 w-40 bg-surface/50 rounded" />
                </div>

                {/* Main Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Stem Archive Skeleton */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Archive Header */}
                        <div className="flex items-center gap-4 pb-6 border-b border-border">
                            <div className="w-12 h-12 rounded-full bg-surface border border-border" />
                            <div>
                                <div className="h-5 w-32 bg-surface rounded mb-2" />
                                <div className="h-3 w-24 bg-surface/50 rounded" />
                            </div>
                        </div>

                        {/* Master Track Skeleton */}
                        <div className="p-6 bg-surface/30 border border-border rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="h-5 w-48 bg-white/10 rounded mb-2" />
                                    <div className="h-3 w-32 bg-white/5 rounded" />
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20" />
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10" />
                                </div>
                            </div>
                        </div>

                        {/* Stem Tracks Skeleton */}
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-3 bg-surface/50 border border-border rounded-lg"
                            >
                                <div className="w-24">
                                    <div className="h-4 w-16 bg-white/10 rounded mb-1" />
                                    <div className="h-2 w-10 bg-white/5 rounded" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="w-8 h-6 bg-white/10 rounded" />
                                    <div className="w-8 h-6 bg-white/10 rounded" />
                                </div>
                                <div className="flex-1 h-1 bg-white/10 rounded-full" />
                                <div className="h-3 w-6 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Right: Sidebar Skeleton */}
                    <div className="space-y-6">
                        <div className="p-6 bg-surface border border-border rounded-lg">
                            <div className="h-5 w-32 bg-white/10 rounded mb-4" />
                            <div className="space-y-3">
                                <div className="h-10 bg-white/5 rounded" />
                                <div className="h-10 bg-white/5 rounded" />
                                <div className="h-10 bg-white/5 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
