'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import * as Tone from 'tone';

interface TrackConfig {
    key: string;
    url: string;
    name: string;
}

interface AudioContextType {
    // State
    isReady: boolean;
    isPlaying: boolean;
    currentProject: string | null;

    // Actions
    loadTracks: (projectId: string, tracks: TrackConfig[]) => Promise<void>;
    togglePlay: () => Promise<void>;
    stop: () => void;
    setVolume: (trackKey: string, volume: number) => void;
    toggleMute: (trackKey: string, isMuted: boolean) => void;
    toggleSolo: (trackKey: string, isSoloed: boolean) => void;
    cleanup: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudioContext() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudioContext must be used within AudioProvider');
    }
    return context;
}

interface AudioProviderProps {
    children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [currentProject, setCurrentProject] = useState<string | null>(null);

    const playersRef = useRef<Map<string, Tone.Player>>(new Map());
    const channelRef = useRef<Map<string, Tone.Channel>>(new Map());

    const cleanup = useCallback(() => {
        playersRef.current.forEach(p => p.dispose());
        channelRef.current.forEach(c => c.dispose());
        playersRef.current.clear();
        channelRef.current.clear();
        Tone.Transport.stop();
        Tone.Transport.cancel();
        setIsPlaying(false);
        setIsReady(false);
    }, []);

    const loadTracks = useCallback(async (projectId: string, tracks: TrackConfig[]) => {
        // Skip if same project already loaded
        if (currentProject === projectId && isReady) return;

        cleanup();
        setCurrentProject(projectId);

        if (!tracks.length) return;

        await Tone.start();

        const loadPromises = tracks.map(track => {
            return new Promise<void>((resolve) => {
                const channel = new Tone.Channel(0, 0).toDestination();
                const player = new Tone.Player({
                    url: track.url,
                    loop: false,
                    onload: () => resolve(),
                    onerror: (e) => {
                        console.error(`Failed to load track ${track.key}`, e);
                        resolve();
                    }
                }).connect(channel);

                player.sync().start(0);
                playersRef.current.set(track.key, player);
                channelRef.current.set(track.key, channel);
            });
        });

        await Promise.all(loadPromises);
        setIsReady(true);
    }, [currentProject, isReady, cleanup]);

    const togglePlay = useCallback(async () => {
        if (!isReady) return;

        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        if (Tone.Transport.state === 'started') {
            Tone.Transport.pause();
            setIsPlaying(false);
        } else {
            Tone.Transport.start();
            setIsPlaying(true);
        }
    }, [isReady]);

    const stop = useCallback(() => {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
        setIsPlaying(false);
    }, []);

    const setVolume = useCallback((trackKey: string, volume: number) => {
        const channel = channelRef.current.get(trackKey);
        if (channel) {
            if (volume <= 0) {
                channel.volume.value = -Infinity;
            } else {
                channel.volume.value = Tone.gainToDb(volume / 100);
            }
        }
    }, []);

    const toggleMute = useCallback((trackKey: string, isMuted: boolean) => {
        const channel = channelRef.current.get(trackKey);
        if (channel) {
            channel.mute = isMuted;
        }
    }, []);

    const toggleSolo = useCallback((trackKey: string, isSoloed: boolean) => {
        const channel = channelRef.current.get(trackKey);
        if (channel) {
            channel.solo = isSoloed;
        }
    }, []);

    // Cleanup on unmount (though this should persist)
    useEffect(() => {
        return () => {
            // Don't cleanup on unmount - we want persistence
        };
    }, []);

    const value: AudioContextType = {
        isReady,
        isPlaying,
        currentProject,
        loadTracks,
        togglePlay,
        stop,
        setVolume,
        toggleMute,
        toggleSolo,
        cleanup,
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}
