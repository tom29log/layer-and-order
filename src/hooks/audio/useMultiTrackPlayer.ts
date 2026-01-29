
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface TrackConfig {
    key: string;
    url: string;
    name: string;
}

export function useMultiTrackPlayer(tracks: TrackConfig[]) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [activeTracks, setActiveTracks] = useState<string[]>([]); // Tracks currently playing (not muted)
    const playersRef = useRef<Map<string, Tone.Player>>(new Map());
    const channelRef = useRef<Map<string, Tone.Channel>>(new Map());

    // Initialize Players
    useEffect(() => {
        let isMounted = true;

        const loadTracks = async () => {
            if (!tracks.length) return;

            // Dispose old players
            playersRef.current.forEach(p => p.dispose());
            channelRef.current.forEach(c => c.dispose());
            playersRef.current.clear();
            channelRef.current.clear();
            setIsReady(false);

            await Tone.start();

            const loadPromises = tracks.map(track => {
                return new Promise<void>((resolve, reject) => {
                    // Create a Channel for volume/pan/mute control
                    const channel = new Tone.Channel(0, 0).toDestination();

                    const player = new Tone.Player({
                        url: track.url,
                        loop: false,
                        onload: () => {
                            if (isMounted) resolve();
                        },
                        onerror: (e) => {
                            console.error(`Failed to load track ${track.key}`, e);
                            resolve(); // Resolve anyway to not block others
                        }
                    }).connect(channel);

                    // Sync to Transport for global control
                    player.sync().start(0);

                    playersRef.current.set(track.key, player);
                    channelRef.current.set(track.key, channel);
                });
            });

            await Promise.all(loadPromises);

            if (isMounted) {
                setIsReady(true);
                setActiveTracks(tracks.map(t => t.key));
            }
        };

        loadTracks();

        return () => {
            isMounted = false;
            playersRef.current.forEach(p => p.dispose());
            channelRef.current.forEach(c => c.dispose());
            playersRef.current.clear();
            channelRef.current.clear();
            Tone.Transport.stop();
            Tone.Transport.cancel();
        };
    }, [JSON.stringify(tracks)]); // Deep compare tracks

    const togglePlay = async () => {
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
    };

    const stop = () => {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
        setIsPlaying(false);
    };

    // Volume Control (-60dB to 0dB)
    const setVolume = useCallback((trackKey: string, volume: number) => {
        const channel = channelRef.current.get(trackKey);
        if (channel) {
            // Volume comes in as 0-100. Convert to Decibels.
            // 0 -> -60dB (effectively mute), 100 -> 0dB
            // Simple mapping: (volume - 100) * 0.6 might allow +gain?
            // Let's stick to standard attenuation: 20 * log10(val/100)

            if (volume <= 0) {
                channel.volume.value = -Infinity;
            } else {
                // Map 0-100 linear range to decibels comfortably
                // 100 = 0dB
                // 50 ~= -6dB ?? No, 50% amplitude is -6dB. 
                // Tone.gainToDb(volume / 100)
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

    return {
        isReady,
        isPlaying,
        togglePlay,
        stop,
        setVolume,
        toggleMute,
        toggleSolo
    };
}
