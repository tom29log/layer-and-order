'use client';

import { useState } from 'react';
import { Archive, Wand2, ChevronRight } from 'lucide-react';

type ServiceType = 'stem-archive' | 'ai-mastering' | null;

interface ServiceSelectorProps {
    onSelect: (service: ServiceType) => void;
    selectedService: ServiceType;
}

export function ServiceSelector({ onSelect, selectedService }: ServiceSelectorProps) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-heading font-light uppercase tracking-tight text-white mb-2">
                    Select Service
                </h2>
                <p className="text-muted font-mono text-xs uppercase tracking-widest">
                    Choose your workflow
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* STEM ARCHIVE */}
                <button
                    onClick={() => onSelect('stem-archive')}
                    className={`group relative p-8 border-2 text-left ${selectedService === 'stem-archive'
                        ? 'glow-cyan-active'
                        : 'border-border bg-surface/50 glow-cyan'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedService === 'stem-archive'
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-500'
                            : 'border-border text-muted group-hover:border-cyan-500/50 group-hover:text-cyan-500'
                            }`}>
                            <Archive size={24} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-heading font-light uppercase tracking-tight mb-2 ${selectedService === 'stem-archive' ? 'text-cyan-500' : 'text-white'
                                }`}>
                                Stem Archive
                            </h3>
                            <p className="text-sm text-muted leading-relaxed">
                                Upload and organize your stems. Keep your project files safe and accessible in the cloud.
                            </p>
                            <ul className="mt-4 space-y-1.5 text-xs font-mono text-neutral-500">
                                <li>• Secure cloud storage</li>
                                <li>• Organize by tracks</li>
                                <li>• Easy file management</li>
                            </ul>
                        </div>
                    </div>
                    {selectedService === 'stem-archive' && (
                        <div className="absolute top-4 right-4">
                            <ChevronRight className="text-cyan-500" size={20} />
                        </div>
                    )}
                </button>

                {/* AI MASTERING */}
                <button
                    onClick={() => onSelect('ai-mastering')}
                    className={`group relative p-8 border-2 text-left ${selectedService === 'ai-mastering'
                        ? 'glow-emerald-active'
                        : 'border-border bg-surface/50 glow-emerald'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedService === 'ai-mastering'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500'
                            : 'border-border text-muted group-hover:border-emerald-500/50 group-hover:text-emerald-500'
                            }`}>
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-heading font-light uppercase tracking-tight mb-2 ${selectedService === 'ai-mastering' ? 'text-emerald-500' : 'text-white'
                                }`}>
                                AI Mastering
                            </h3>
                            <p className="text-sm text-muted leading-relaxed">
                                Professional-grade AI mastering powered by cutting-edge neural networks.
                            </p>
                            <ul className="mt-4 space-y-1.5 text-xs font-mono text-neutral-500">
                                <li>• Instant mastering</li>
                                <li>• A/B comparison</li>
                                <li>• Download 24-bit WAV</li>
                            </ul>
                        </div>
                    </div>
                    {selectedService === 'ai-mastering' && (
                        <div className="absolute top-4 right-4">
                            <ChevronRight className="text-emerald-500" size={20} />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
