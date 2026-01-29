'use client';

import { useState } from 'react';
import { ServiceSelector } from './ServiceSelector';
import { StemArchiveInterface } from './StemArchiveInterface';
import { MasteringInterface } from './MasteringInterface';
import { ArrowLeft, ChevronRight } from 'lucide-react';

type ServiceType = 'stem-archive' | 'ai-mastering' | null;

interface Stem {
    id: string;
    name: string;
    file_path: string;
    file_size: number;
    stem_type: string;
}

interface StudioContainerProps {
    projectId: string;
    originalAudioUrl?: string;
    stems: Stem[];
}

export function StudioContainer({ projectId, originalAudioUrl, stems }: StudioContainerProps) {
    const [selectedService, setSelectedService] = useState<ServiceType>(null);
    const [showInterface, setShowInterface] = useState(false);

    const handleServiceSelect = (service: ServiceType) => {
        setSelectedService(service);
    };

    const handleProceed = () => {
        if (selectedService) {
            setShowInterface(true);
        }
    };

    const handleBack = () => {
        setShowInterface(false);
        setSelectedService(null);
    };

    // Show selected interface directly when card is clicked
    if (selectedService) {
        return (
            <div className="space-y-6">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-white hover:text-[#FF5F1F] font-mono text-sm transition-colors"
                >
                    <ArrowLeft size={14} />
                    BACK_TO_SERVICES
                </button>

                {selectedService === 'stem-archive' && (
                    <StemArchiveInterface projectId={projectId} stems={stems} originalAudioUrl={originalAudioUrl} />
                )}
                {selectedService === 'ai-mastering' && (
                    <MasteringInterface projectId={projectId} originalAudioUrl={originalAudioUrl} />
                )}
            </div>
        );
    }

    // Show service selector
    return (
        <div className="space-y-8">
            <ServiceSelector
                onSelect={handleServiceSelect}
                selectedService={selectedService}
            />

            {/* Proceed Button */}
            {selectedService && (
                <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={handleProceed}
                        className={`px-8 py-4 border-2 text-sm font-mono uppercase flex items-center gap-3 transition-all ${selectedService === 'stem-archive'
                            ? 'border-cyan-500 bg-cyan-500 text-black hover:bg-cyan-400'
                            : 'border-emerald-500 bg-emerald-500 text-black hover:bg-emerald-400'
                            }`}
                    >
                        Start {selectedService === 'stem-archive' ? 'Archive' : 'Mastering'}
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
