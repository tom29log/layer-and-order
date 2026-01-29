'use client';

import { useState, useTransition, useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/audio/useAudioPlayer';
import { Play, Pause, Wand2, Download, Square } from 'lucide-react';
import { startMastering } from '@/app/actions/mastering';

interface MasteringInterfaceProps {
    projectId: string;
    // Initial Stems or Mix URL
    originalAudioUrl?: string;
}

export function MasteringInterface({ projectId, originalAudioUrl }: MasteringInterfaceProps) {
    // Manual Server Action Management using useTransition
    const [isPending, startTransition] = useTransition();

    // Local UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string>("Ready to Master");
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [waveformHeights, setWaveformHeights] = useState<number[]>([]);

    // Comparison State
    const [isComparing, setIsComparing] = useState(false); // If true, result view is active
    const [playbackSource, setPlaybackSource] = useState<'original' | 'mastered'>('original');
    const [isMockMode, setIsMockMode] = useState(false);

    useEffect(() => {
        setWaveformHeights(Array.from({ length: 20 }, () => Math.max(20, Math.random() * 100)));
    }, []);

    // Determined source for the audio player
    const activeAudioUrl = playbackSource === 'mastered' && resultUrl ? resultUrl : originalAudioUrl;

    const { isPlaying, progress, togglePlay, stop } = useAudioPlayer({ src: activeAudioUrl });

    const handleMastering = () => {
        if (!originalAudioUrl) return;

        // Visual feedback immediately
        setIsProcessing(true);
        setStatusMessage("Initializing Audio Engine...");

        startTransition(async () => {
            // Visual timers (UI only)
            const t1 = setTimeout(() => setStatusMessage("Analyzing Frequency Spectrum..."), 2000);
            const t2 = setTimeout(() => setStatusMessage("Re-architecting Sound Stage..."), 4000);

            try {
                // Call Server Action
                const result = await startMastering(projectId, originalAudioUrl);

                // Cleanup
                clearTimeout(t1);
                clearTimeout(t2);

                if (result.success) {
                    setStatusMessage("Mastering Complete");
                    setIsProcessing(false);
                    setIsComparing(true); // Enable comparison mode

                    // In mock mode, use original audio as "mastered" output for demo purposes
                    const outputUrl = result.isMock ? originalAudioUrl : (result.output || originalAudioUrl);
                    setResultUrl(outputUrl);

                    if (result.isMock) {
                        setIsMockMode(true);
                    }

                    // Auto-switch to mastered version
                    setPlaybackSource('mastered');

                } else {
                    setStatusMessage("Error: " + (result.error || "Failed"));
                    setIsProcessing(false);
                }
            } catch (e) {
                console.error(e);
                clearTimeout(t1);
                clearTimeout(t2);
                setStatusMessage("System Error");
                setIsProcessing(false);
            }
        });
    };

    const handleDownload = () => {
        if (resultUrl) {
            window.open(resultUrl, '_blank');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Visualizer / Status Area */}
            <div className={`relative h-64 w-full border border-border bg-black overflow-hidden flex items-center justify-center transition-all duration-1000 ${isProcessing ? 'border-emerald-500/50' : ''}`}>

                {/* Background Grid - Precision Lines */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Mock Mode Badge */}
                {isMockMode && resultUrl && (
                    <div className="absolute top-4 right-4 z-50 bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 text-[10px] px-2 py-1 rounded font-mono uppercase tracking-widest">
                        MOCK MODE (Sample Audio)
                    </div>
                )}

                {isProcessing ? (
                    <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md">
                        {/* Matrix Animation: Scanning Effect */}
                        <div className="w-full h-1 bg-neutral-800 overflow-hidden relative">
                            <div className="absolute inset-0 bg-emerald-500 animate-[shimmer_2s_infinite]" />
                        </div>

                        <div className="space-y-1 text-center">
                            <p className="font-mono text-xs uppercase tracking-widest text-emerald-500 animate-pulse">
                                {statusMessage}
                            </p>
                            <p className="font-mono text-[10px] text-muted">
                                AI_MODEL: REPLICATE_AUDIO_GEN_V2
                            </p>
                        </div>
                    </div>
                ) : isComparing ? (
                    <div className="relative z-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 border border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Wand2 className="text-emerald-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-heading text-white tracking-tight">Mastering Complete</h2>

                        {/* Comparison Toggles */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => setPlaybackSource('original')}
                                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all ${playbackSource === 'original' ? 'bg-white text-black border-white' : 'text-neutral-500 border-neutral-800 hover:border-neutral-500'}`}
                            >
                                Original
                            </button>
                            <button
                                onClick={() => setPlaybackSource('mastered')}
                                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all ${playbackSource === 'mastered' ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-neutral-500 border-neutral-800 hover:border-neutral-500'}`}
                            >
                                Mastered
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 text-center space-y-4">
                        {/* Static Waveform Representation */}
                        <div className="flex items-center justify-center gap-1 h-12">
                            {/* Use stable values for initial render to prevent hydration mismatch */}
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-neutral-700 transition-all duration-500"
                                    style={{
                                        height: waveformHeights[i] ? `${waveformHeights[i]}%` : '20%'
                                    }}
                                />
                            ))}
                        </div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
                            Input Signal Ready
                        </p>
                    </div>
                )}
            </div>

            {/* Control Room Panel */}
            {!isProcessing && (
                <div className="border-t border-border pt-8 flex items-center justify-between">

                    {/* Tactile Player Controls */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            {/* Stop Button */}
                            <button
                                onClick={() => { stop(); }}
                                disabled={!activeAudioUrl}
                                title="정지 (처음으로)"
                                className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center text-muted hover:text-white hover:border-white transition-all duration-200 active:scale-95"
                            >
                                <Square size={12} fill="currentColor" />
                            </button>

                            {/* Play/Pause Button */}
                            <button
                                onClick={() => { togglePlay(); }}
                                disabled={!activeAudioUrl}
                                className={`
                                    w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95
                                    ${isPlaying
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'bg-surface border-border text-white hover:border-white'
                                    }
                                `}
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                            </button>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${playbackSource === 'mastered' ? 'bg-emerald-500' : 'bg-white'}`} />
                                <span className="font-mono text-xs text-white tracking-widest uppercase">
                                    {playbackSource === 'mastered' ? 'Mastered Mix' : 'Original Mix'}
                                </span>
                            </div>
                            <p className="font-mono text-[10px] text-muted">
                                {playbackSource === 'mastered' ? 'Ai Enhanced / 24bit' : '44.1kHz / 24bit'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                        {isComparing && (
                            <button
                                onClick={handleDownload}
                                className="
                                    group relative overflow-hidden bg-neutral-900 border border-border px-6 py-4 
                                    font-mono text-sm uppercase tracking-widest text-neutral-400
                                    hover:text-white hover:border-white transition-all duration-300
                                "
                            >
                                <span className="flex items-center gap-2">
                                    <Download size={16} />
                                    Download WAV
                                </span>
                            </button>
                        )}

                        {!isComparing && (
                            <button
                                onClick={() => handleMastering()}
                                disabled={isProcessing || !originalAudioUrl}
                                className="
                                    group relative overflow-hidden bg-neutral-900 border border-border px-8 py-4 
                                    font-mono text-sm uppercase tracking-widest text-neutral-400
                                    hover:text-emerald-500 hover:border-emerald-500/50 transition-all duration-300
                                "
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Wand2 size={16} />
                                    Start Engine
                                </span>
                                <div className="absolute inset-0 bg-emerald-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Precision Progress Bar */}
            {!isProcessing && (
                <div className="relative w-full bg-neutral-800 h-[1px] mt-8 group active:h-1 transition-all cursor-pointer">
                    <div className="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}
