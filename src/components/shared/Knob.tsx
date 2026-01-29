'use client';

import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
    value: number; // 0 to 100
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    size?: number;
    label?: string;
    color?: string; // Tailwind color class for the indicator usually
}

export function Knob({
    value,
    onChange,
    min = 0,
    max = 100,
    size = 64,
    label,
    color = 'bg-cyan-500'
}: KnobProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startValue, setStartValue] = useState(0);
    const sensitivity = 2; // Pixels per unit

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartY(e.clientY);
        setStartValue(value);
        document.body.style.cursor = 'ns-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaY = startY - e.clientY; // Drag up to increase
            const deltaValue = deltaY / sensitivity;

            let newValue = startValue + deltaValue;
            newValue = Math.min(Math.max(newValue, min), max); // Clamp

            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startY, startValue, onChange, min, max]);

    // Calculate rotation: 0 (min) -> -135deg, 100 (max) -> 135deg
    // Total range 270 degrees
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270);

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            <div
                className="relative rounded-full bg-neutral-800 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(255,255,255,0.1)] cursor-ns-resize group"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
            >
                {/* Metallic Texture/Rim */}
                <div className="absolute inset-0 rounded-full border border-neutral-700 pointer-events-none" />

                {/* Indicator Container - Rotates */}
                <div
                    className="absolute inset-0 w-full h-full rounded-full transition-transform duration-75 will-change-transform"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {/* The pointer/dot */}
                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 h-[30%] w-[10%] flex flex-col items-center justify-start">
                        <div className={`w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_5px_currentColor]`} />
                    </div>
                </div>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full bg-linear-to-b from-neutral-700 to-neutral-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-neutral-600 flex items-center justify-center">
                    {/* Optional: Inner Screw or detail */}
                    <div className="w-1/2 h-1/2 rounded-full bg-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
                </div>
            </div>

            {/* Label & Value */}
            <div className="text-center">
                {label && (
                    <div className="font-mono text-[10px] uppercase text-muted mb-0.5 tracking-wider">{label}</div>
                )}
                {/* <div className="font-mono text-xs text-white">{Math.round(value)}%</div> */}
            </div>
        </div>
    );
}
