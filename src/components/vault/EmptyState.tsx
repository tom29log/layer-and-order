'use client';

export function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg bg-surface/30">
            <div className="text-muted text-center space-y-2">
                <h3 className="font-heading text-xl text-white">No Projects Found</h3>
                <p className="font-mono text-sm max-w-sm">
                    Your vault is empty. Initialize a new project to start archiving stems.
                </p>
            </div>
        </div>
    )
}
