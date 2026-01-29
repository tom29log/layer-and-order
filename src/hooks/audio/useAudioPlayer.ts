import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface UseAudioPlayerProps {
    src?: string | null;
}

export function useAudioPlayer({ src }: UseAudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const playerRef = useRef<Tone.Player | null>(null);
    const animationRef = useRef<number | null>(null);

    // Initializer: Only runs on user interaction
    const initializeAudio = async () => {
        if (!src) return;

        // Start Audio Context if suspended (Safari requirement)
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        if (!playerRef.current) {
            playerRef.current = new Tone.Player(src).toDestination();
            await Tone.loaded();
            playerRef.current.sync().start(0);
            setIsReady(true);
        }
    };

    // Handle src changes
    useEffect(() => {
        if (playerRef.current && src) {
            const wasPlaying = isPlaying;
            playerRef.current.load(src).then(() => {
                if (wasPlaying) {
                    Tone.Transport.start(); // Resume if it was playing
                }
            });
        }
    }, [src]);

    const togglePlay = async () => {
        if (!isReady || !playerRef.current) {
            await initializeAudio();
        }

        if (Tone.Transport.state === 'started') {
            Tone.Transport.pause();
            setIsPlaying(false);
        } else {
            Tone.Transport.start();
            setIsPlaying(true);
        }
    };

    // Update progress
    useEffect(() => {
        const updateProgress = () => {
            if (playerRef.current && isPlaying) {
                const current = Tone.Transport.seconds;
                const duration = playerRef.current.buffer.duration;
                if (duration > 0) {
                    setProgress((current / duration) * 100);
                }

                if (current >= duration) {
                    Tone.Transport.stop();
                    setIsPlaying(false);
                    setProgress(0);
                }

                animationRef.current = requestAnimationFrame(updateProgress);
            }
        };

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(updateProgress);
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
    }, [isPlaying]);

    // Dispose on unmount
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
            }
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }
    }, []);

    // Stop and reset to beginning (without auto-play)
    const stop = () => {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
        setProgress(0);
        setIsPlaying(false);
    };

    return {
        isPlaying,
        isReady,
        progress,
        togglePlay,
        stop,
        initializeAudio
    };
}
