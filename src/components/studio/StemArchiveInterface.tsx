'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Archive, Scissors, Loader2, Play, Pause, Square, Volume2 } from 'lucide-react';
import { separateStems } from '@/app/actions/stems';
import { useMultiTrackPlayer } from '@/hooks/audio/useMultiTrackPlayer';

interface Stem {
    id: string;
    name: string;
    file_path: string;
    file_size: number;
    stem_type: string;
    url?: string;
}

interface SeparatedStems {
    vocals: string;
    drums: string;
    bass: string;
    other: string;
}

interface StemArchiveInterfaceProps {
    projectId: string;
    stems: Stem[];
    originalAudioUrl?: string;
}

export function StemArchiveInterface({ projectId, stems, originalAudioUrl }: StemArchiveInterfaceProps) {
    const [selectedForSeparation, setSelectedForSeparation] = useState<string | null>(null);
    const [isSeparating, setIsSeparating] = useState(false);
    const [separationProgress, setSeparationProgress] = useState(0);
    const [separatedStems, setSeparatedStems] = useState<SeparatedStems | null>(null);
    const [isMockMode, setIsMockMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Identify Master Track strictly
    // Strategy: Look for explicit type 'master', or name match, OR fall back to finding one that is NOT a separated stem type.
    const knownStemTypes = ['vocals', 'drums', 'bass', 'other', 'synth'];
    let masterTrack = stems.find(s => s.stem_type === 'master' || s.name.toLowerCase().includes('original') || s.name.toLowerCase().includes('master'));

    // Fallback: If no master found, look for a track that is NOT in knownStemTypes
    if (!masterTrack) {
        masterTrack = stems.find(s => !knownStemTypes.includes(s.stem_type || ''));
    }

    // 2. Filter Tracks for Player/Mixer (Exclude Master)
    const tracks = separatedStems ? [
        { key: 'vocals', type: 'vocals', name: 'Vocals', url: separatedStems.vocals },
        { key: 'drums', type: 'drums', name: 'Drums', url: separatedStems.drums },
        { key: 'bass', type: 'bass', name: 'Bass', url: separatedStems.bass },
        { key: 'other', type: 'other', name: 'Other', url: separatedStems.other },
    ] : stems
        .filter(s => s.id !== masterTrack?.id) // Strictly exclude the identified master track
        .filter(s => s.url && s.url.length > 0)
        .map(s => ({
            key: s.id, // UNIQUE ID
            type: s.stem_type || 'other',
            name: s.name,
            url: s.url || '',
            id: s.id
        }));

    // Audio Engine Hook (Expects objects with 'key' and 'url')
    const {
        isReady,
        isPlaying,
        togglePlay,
        stop,
        setVolume,
        toggleMute,
        toggleSolo
    } = useMultiTrackPlayer(tracks);

    // Local State for UI feedback
    const [volumes, setVolumes] = useState<Record<string, number>>({});
    const [soloTracks, setSoloTracks] = useState<string[]>([]);
    const [mutedTracks, setMutedTracks] = useState<string[]>([]);

    useEffect(() => {
        const initialVolumes: Record<string, number> = {};
        tracks.forEach(t => {
            initialVolumes[t.key] = 100;
        });
        setVolumes(initialVolumes);
    }, [separatedStems, stems]);


    // Handle Volume Change
    const handleVolumeChange = (key: string, val: number) => {
        setVolumes(prev => ({ ...prev, [key]: val }));
        setVolume(key, val);
    };

    // Handle Solo/Mute UI & Logic
    const handleToggleSolo = (key: string) => {
        const newSolo = soloTracks.includes(key)
            ? soloTracks.filter(k => k !== key)
            : [...soloTracks, key];

        setSoloTracks(newSolo);
        toggleSolo(key, newSolo.length > 0 && newSolo.includes(key));

        tracks.forEach(t => {
            const isTrackSoloed = newSolo.includes(t.key);
            toggleSolo(t.key, isTrackSoloed);
        });
    };

    const handleToggleMute = (key: string) => {
        const newMuted = mutedTracks.includes(key)
            ? mutedTracks.filter(k => k !== key)
            : [...mutedTracks, key];

        setMutedTracks(newMuted);
        toggleMute(key, newMuted.includes(key));
    };

    const handleSeparateStems = async () => {
        const audioToSeparate = originalAudioUrl;

        if (!audioToSeparate) {
            setError('No audio source available for separation');
            return;
        }

        setIsSeparating(true);
        setError(null);
        setSeparationProgress(0);

        const progressInterval = setInterval(() => {
            setSeparationProgress(prev => {
                if (prev < 30) return prev + 2;
                if (prev < 70) return prev + 0.5;
                if (prev < 90) return prev + 0.1;
                return prev;
            });
        }, 1000);

        startTransition(async () => {
            try {
                const startResult = await separateStems(projectId, audioToSeparate!);

                if (!startResult.success) {
                    setError(startResult.error || 'Failed to start separation');
                    setIsSeparating(false);
                    clearInterval(progressInterval);
                    return;
                }

                if (startResult.isMock && startResult.stems) {
                    setSeparationProgress(100);
                    setSeparatedStems(startResult.stems);
                    setIsMockMode(true);
                    setIsSeparating(false);
                    clearInterval(progressInterval);
                    return;
                }

                if (startResult.status === 'succeeded' && startResult.stems) {
                    setSeparationProgress(100);
                    setSeparatedStems(startResult.stems);
                    setIsSeparating(false);
                    clearInterval(progressInterval);
                    return;
                }

                const predictionId = startResult.predictionId;
                if (!predictionId) {
                    setError('No prediction ID returned');
                    setIsSeparating(false);
                    clearInterval(progressInterval);
                    return;
                }

                const { checkStemStatus, saveSeparatedStems } = await import('@/app/actions/stems');

                const pollInterval = setInterval(async () => {
                    const statusResult = await checkStemStatus(predictionId);

                    if (!statusResult.success) {
                        setError(statusResult.error || 'Polling failed');
                        clearInterval(pollInterval);
                        clearInterval(progressInterval);
                        setIsSeparating(false);
                        return;
                    }

                    if (statusResult.status === 'succeeded' && statusResult.stems) {
                        clearInterval(pollInterval);
                        clearInterval(progressInterval);
                        setSeparationProgress(100);

                        try {
                            const saveResult = await saveSeparatedStems(projectId, statusResult.stems);
                            if (!saveResult.success) {
                                setError(`Save Error: ${saveResult.error}`);
                            } else {
                                setSeparatedStems(null);
                            }
                        } catch (e) {
                            console.error("Auto-save failed", e);
                            setError('Auto-save failed');
                        }

                        setIsSeparating(false);

                    } else if (statusResult.status === 'failed' || statusResult.status === 'canceled') {
                        clearInterval(pollInterval);
                        clearInterval(progressInterval);
                        setError(statusResult.error || 'Separation failed during processing');
                        setIsSeparating(false);
                    }
                }, 3000);

            } catch (err) {
                console.error(err);
                setError('An error occurred during stem separation');
                setIsSeparating(false);
                clearInterval(progressInterval);
            }
        });
    };

    const stemTypeColors: Record<string, string> = {
        'vocals': 'text-pink-500 border-pink-500/50 bg-pink-500/10',
        'drums': 'text-orange-500 border-orange-500/50 bg-orange-500/10',
        'bass': 'text-purple-500 border-purple-500/50 bg-purple-500/10',
        'other': 'text-cyan-500 border-cyan-500/50 bg-cyan-500/10',
        'synth': 'text-cyan-500 border-cyan-500/50 bg-cyan-500/10',
        'master': 'text-white border-white/50 bg-white/10',
    };

    const totalSize = stems.reduce((acc, stem) => acc + stem.file_size, 0);

    return (
        <div className="space-y-8">
            {/* Header / Title Only */}
            <div className="border-b border-border pb-6 flex justify-between items-end">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-cyan-500 bg-cyan-500/20 flex items-center justify-center">
                        <Archive size={20} className="text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-light uppercase tracking-tight text-white">
                            Stem Archive
                        </h2>
                        <p className="text-muted font-mono text-xs">
                            {stems.length} files • {(totalSize / 1024 / 1024).toFixed(2)} MB total
                        </p>
                    </div>
                </div>
            </div>

            {isSeparating && (
                <div className="p-6 border border-cyan-500/30 bg-cyan-500/5 animate-in fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        <Loader2 size={24} className="text-cyan-500 animate-spin" />
                        <div>
                            <h3 className="font-mono text-sm text-white">AI Stem Separation in Progress</h3>
                            <p className="font-mono text-xs text-muted">Processing... (This usually takes 1-3 minutes)</p>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all duration-500"
                            style={{ width: `${separationProgress}%` }}
                        />
                    </div>
                    <p className="text-right font-mono text-xs text-cyan-500 mt-2">{Math.round(separationProgress)}%</p>
                </div>
            )}

            {/* Error Message */}
            {
                error && (
                    <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-sm">
                        {error}
                    </div>
                )
            }

            {/* Main Unified List */}
            {tracks.length > 0 || masterTrack ? (
                <div className="space-y-4 animate-in fade-in">

                    {/* 1. Master Track (The Controller) */}
                    {masterTrack && (
                        <div className="group p-6 border border-border bg-surface/30 opacity-100 rounded-lg relative overflow-hidden flex items-center justify-between">
                            {/* Track Info */}
                            <div className="relative z-10 w-2/3">
                                <h4 className="text-lg font-heading font-light text-white truncate mb-1">{masterTrack.name}</h4>
                                <span className="uppercase tracking-widest text-xs font-mono text-muted">ORIGINAL TRACK (MASTER)</span>
                            </div>

                            {/* GLOBAL PLAYBACK CONTROLS (Only visible if stems are ready) */}
                            <div className="flex items-center gap-3 relative z-10">
                                <button
                                    onClick={() => togglePlay()}
                                    disabled={!isReady}
                                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                    ${isPlaying
                                            ? 'border-emerald-500 bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                            : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'
                                        }
                                    ${!isReady ? 'opacity-50 cursor-wait' : ''}
                                `}
                                >
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                                </button>
                                <button
                                    onClick={stop}
                                    disabled={!isReady}
                                    className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                                >
                                    <Square size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. Separated Stems (Slim Rows) */}
                    <div className="space-y-3 pt-2">
                        {tracks.map((track) => {
                            // Style Logic - Use track.type
                            let colorKey = 'other';
                            const tName = track.name.toLowerCase();
                            const tType = (track as any).type || '';

                            if (tType === 'vocals' || tName.includes('vocal')) colorKey = 'vocals';
                            else if (tType === 'drums' || tName.includes('drum')) colorKey = 'drums';
                            else if (tType === 'bass' || tName.includes('bass')) colorKey = 'bass';
                            else if (tType === 'other' || tName.includes('other')) colorKey = 'other';

                            const colorClass = stemTypeColors[colorKey] || stemTypeColors['other'];

                            const isSolo = soloTracks.includes(track.key);
                            const isMuted = mutedTracks.includes(track.key);
                            const isActive = soloTracks.length === 0 || isSolo;

                            return (
                                <div
                                    key={track.key + track.url}
                                    className={`w-full flex items-center gap-4 bg-surface/50 border border-border p-3 rounded-lg transition-all ${!isActive || isMuted ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    {/* Name Only */}
                                    <div className="w-24 shrink-0 pl-2">
                                        <h4 className="font-mono text-sm uppercase text-white truncate">{track.name}</h4>
                                        <span className="text-[10px] text-muted font-mono uppercase">{colorKey}</span>
                                    </div>

                                    {/* Controls - Vertical Stack */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleToggleSolo(track.key)}
                                            className={`w-8 h-6 flex items-center justify-center text-[9px] font-mono border rounded transition-colors ${isSolo
                                                ? 'bg-yellow-500 text-black border-yellow-500'
                                                : 'border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            S
                                        </button>
                                        <button
                                            onClick={() => handleToggleMute(track.key)}
                                            className={`w-8 h-6 flex items-center justify-center text-[9px] font-mono border rounded transition-colors ${isMuted
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            M
                                        </button>
                                    </div>

                                    {/* Volume Slider (Fluorescent Blue) */}
                                    <div className="flex-1 flex items-center gap-3 px-4">
                                        <Volume2 size={14} className="text-muted" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={volumes[track.key] ?? 100}
                                            onChange={(e) => handleVolumeChange(track.key, parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer 
                                            [&::-webkit-slider-thumb]:appearance-none 
                                            [&::-webkit-slider-thumb]:w-3 
                                            [&::-webkit-slider-thumb]:h-3 
                                            [&::-webkit-slider-thumb]:rounded-full 
                                            [&::-webkit-slider-thumb]:bg-cyan-400
                                            [&::-moz-range-thumb]:bg-cyan-400
                                            "
                                        />
                                    </div>

                                    {/* Download */}
                                    {track.url && (
                                        <a
                                            href={track.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-mono text-muted hover:text-cyan-500 shrink-0"
                                        >
                                            DL
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                // Empty State
                <div className="text-center py-16 border border-dashed border-border">
                    <FolderOpen size={48} className="mx-auto text-muted mb-4" />
                    <h3 className="text-lg font-heading font-light text-white mb-2">No Stems Yet</h3>
                    <p className="text-muted text-sm font-mono mb-6">
                        Use AI Separation to create stems from your original track.
                    </p>
                    <button
                        onClick={handleSeparateStems}
                        disabled={!originalAudioUrl}
                        className="px-6 py-3 border-2 border-cyan-500 bg-cyan-500 text-black text-xs font-mono uppercase flex items-center gap-2 mx-auto hover:bg-cyan-400 transition-colors disabled:opacity-50"
                    >
                        <Scissors size={14} />
                        Separate Stems (AI)
                    </button>
                </div>
            )}

        </div>
    );
}
