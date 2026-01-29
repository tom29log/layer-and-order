export function usePlayer() {
    const play = () => console.log("Play");
    const stop = () => console.log("Stop");
    return { play, stop };
}
