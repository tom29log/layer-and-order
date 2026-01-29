'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Archive, Music, FolderOpen, Scissors, Loader2, Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { separateStems } from '@/app/actions/stems';
import { useMultiTrackPlayer } from '@/hooks/audio/useMultiTrackPlayer';
import { Knob } from '@/components/shared/Knob';

interface Stem {
    id: string;
    name: string;
    file_path: string;
    file_size: number;
    stem_type: string;
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
    const [selectedStems, setSelectedStems] = useState<string[]>([]);
    const [selectedForSeparation, setSelectedForSeparation] = useState<string | null>(null);
    const [isSeparating, setIsSeparating] = useState(false);
    const [separationProgress, setSeparationProgress] = useState(0);
    const [separatedStems, setSeparatedStems] = useState<SeparatedStems | null>(null);
    const [isMockMode, setIsMockMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track Configuration for MultiTrackPlayer
    const tracks = separatedStems ? [
        { key: 'vocals', name: 'Vocals', url: separatedStems.vocals },
        { key: 'drums', name: 'Drums', url: separatedStems.drums },
        { key: 'bass', name: 'Bass', url: separatedStems.bass },
        { key: 'other', name: 'Other', url: separatedStems.other },
    ] : [];

    // Audio Engine Hook
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
    const [volumes, setVolumes] = useState<Record<string, number>>({
        vocals: 100, drums: 100, bass: 100, other: 100
    });
    const [soloTracks, setSoloTracks] = useState<string[]>([]);
    const [mutedTracks, setMutedTracks] = useState<string[]>([]);

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

        // Update all tracks solo state to ensure proper exclusivity if needed
        // But hook handles individual channel solo. Tone.js solo works by muting others.
        // If we have multiple solos, Tone.js handles summing them.
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

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSeparateStems = async () => {
        // Use selected stem or fallback to originalAudioUrl
        const audioToSeparate = selectedForSeparation || originalAudioUrl;

        if (!audioToSeparate) {
            setError('Select a track to separate or upload audio first');
            return;
        }

        setIsSeparating(true);
        setError(null);
        setSeparationProgress(0);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
            setSeparationProgress(prev => Math.min(prev + Math.random() * 15, 90));
        }, 1000);

        startTransition(async () => {
            try {
                const result = await separateStems(projectId, audioToSeparate!);

                clearInterval(progressInterval);

                if (result.success && result.stems) {
                    setSeparationProgress(100);
                    setSeparatedStems(result.stems);
                    if (result.isMock) {
                        setIsMockMode(true);
                    }
                } else {
                    setError(result.error || 'Failed to separate stems');
                }
            } catch (err) {
                setError('An error occurred during stem separation');
            } finally {
                setIsSeparating(false);
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
            {/* Header */}
            <div className="border-b border-border pb-6">
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

            {/* Separation Progress */}
            {isSeparating && (
                <div className="p-6 border border-cyan-500/30 bg-cyan-500/5 animate-in fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        <Loader2 size={24} className="text-cyan-500 animate-spin" />
                        <div>
                            <h3 className="font-mono text-sm text-white">AI Stem Separation in Progress</h3>
                            <p className="font-mono text-xs text-muted">Separating into 4 tracks: Vocals, Drums, Bass, Other</p>
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

            {/* Separated Stems Result */}
            {separatedStems && !isSeparating && (
                <div className="p-6 border border-emerald-500/30 bg-emerald-500/5 animate-in fade-in">
                    {/* Header with Global Controls */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                                <Scissors size={16} className="text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-mono text-sm text-white">Stems Separated Successfully!</h3>
                                <p className="font-mono text-xs text-muted">
                                    4 tracks extracted {isMockMode && '(DEMO MODE)'}
                                </p>
                            </div>
                        </div>

                        {/* Global Playback Controls */}
                        <div className="flex items-center gap-2">
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

                    {/* Stem Tracks with Solo/Mute & Knobs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tracks.map((track) => {
                            const colorClass = stemTypeColors[track.key] || stemTypeColors['other'];
                            const isSolo = soloTracks.includes(track.key);
                            const isMuted = mutedTracks.includes(track.key);
                            const isActive = soloTracks.length === 0 || isSolo; // Visual dimming if not soloed

                            return (
                                <div
                                    key={track.key}
                                    className={`p-4 border transition-all flex flex-col justify-between h-full ${colorClass} ${!isActive || isMuted ? 'opacity-60' : ''}`}
                                >
                                    {/* Top Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <Music size={20} />
                                            <div className="flex gap-1">
                                                {/* Solo Button */}
                                                <button
                                                    onClick={() => handleToggleSolo(track.key)}
                                                    className={`px-2 py-1 text-[10px] font-mono uppercase border transition-colors ${isSolo
                                                        ? 'bg-yellow-500 text-black border-yellow-500'
                                                        : 'border-current hover:bg-current/20'
                                                        }`}
                                                >
                                                    S
                                                </button>
                                                {/* Mute Button */}
                                                <button
                                                    onClick={() => handleToggleMute(track.key)}
                                                    className={`px-2 py-1 text-[10px] font-mono uppercase border transition-colors ${isMuted
                                                        ? 'bg-red-500 text-white border-red-500'
                                                        : 'border-current hover:bg-current/20'
                                                        }`}
                                                >
                                                    M
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="font-mono text-sm uppercase mb-4">{track.name}</h4>
                                    </div>

                                    {/* Control Section */}
                                    <div className="flex flex-col items-center gap-4 mt-auto">
                                        <Knob
                                            value={volumes[track.key]}
                                            onChange={(val) => handleVolumeChange(track.key, val)}
                                            size={60}
                                            label="LEVEL"
                                            color={isMuted ? 'bg-red-500' : 'bg-cyan-500'}
                                        />

                                        <a
                                            href={track.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-[10px] text-muted hover:underline mt-2"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-sm">
                    {error}
                </div>
            )}

            {/* Existing Stems Grid */}
            {stems.length > 0 ? (
                <div>
                    <h3 className="font-mono text-xs text-muted uppercase mb-4">
                        Select a track for AI Stem Separation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stems.map((stem) => {
                            const isSelectedForSep = selectedForSeparation === stem.id;
                            const colorClass = stemTypeColors[stem.stem_type] || stemTypeColors['other'];

                            return (
                                <div
                                    key={stem.id}
                                    onClick={() => {
                                        console.log('Selecting stem:', stem.id, stem.file_path);
                                        setSelectedForSeparation(stem.id);
                                    }}
                                    className={`group p-4 border cursor-pointer transition-all ${isSelectedForSep
                                        ? 'border-cyan-500 bg-cyan-500/20 ring-2 ring-cyan-500/50'
                                        : 'border-border bg-surface/50 hover:border-cyan-500/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-8 h-8 rounded border flex items-center justify-center ${colorClass}`}>
                                            <Music size={14} />
                                        </div>
                                        {isSelectedForSep && (
                                            <span className="text-[10px] font-mono text-cyan-500 uppercase">Selected</span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-mono text-white truncate mb-1">{stem.name}</h4>
                                    <div className="flex justify-between text-[10px] font-mono text-muted">
                                        <span className="uppercase">{stem.stem_type}</span>
                                        <span>{(stem.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Start Engine Button - Mastering Style (Hidden if already separated) */}
                    {!separatedStems && (
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleSeparateStems}
                                disabled={!selectedForSeparation || isSeparating}
                                className="
                                    group relative overflow-hidden bg-neutral-900 border border-border px-10 py-4 
                                    font-mono text-sm uppercase tracking-widest text-neutral-400
                                    glow-cyan
                                    disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-neutral-400 disabled:hover:border-border disabled:hover:shadow-none
                                "
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {isSeparating ? <Loader2 size={18} className="animate-spin" /> : <Scissors size={18} />}
                                    {isSeparating ? 'Processing...' : 'Start Engine'}
                                </span>
                                <div className="absolute inset-0 bg-cyan-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        </div>
                    )}
                </div>
            ) : !separatedStems && (
                <div className="text-center py-16 border border-dashed border-border">
                    <FolderOpen size={48} className="mx-auto text-muted mb-4" />
                    <h3 className="text-lg font-heading font-light text-white mb-2">No Stems Yet</h3>
                    <p className="text-muted text-sm font-mono mb-6">
                        Use AI Separation or upload your stems manually
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
