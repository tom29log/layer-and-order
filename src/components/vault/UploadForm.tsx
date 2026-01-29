'use client';

import { useState, useActionState, ChangeEvent, useTransition } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { getPresignedUploadUrl } from '@/app/actions/upload';
import { createProject } from '@/app/actions/project';

interface FileUpload {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    r2Key?: string;
    r2Url?: string;
}

const initialState = {
    error: '',
    success: false
}

export function UploadForm() {
    const [state, formAction, isPending] = useActionState(createProject, initialState);

    // Local state for files to manage upload progress UI
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [isUploadingToR2, setIsUploadingToR2] = useState(false);
    const [stemsData, setStemsData] = useState<string>('[]'); // JSON string for hidden input

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: FileUpload[] = Array.from(e.target.files).map(file => ({
                file,
                status: 'pending'
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const [isPendingTransition, startTransition] = useTransition();

    const handleUploadAndSubmit = async (formData: FormData) => {
        setIsUploadingToR2(true);
        const uploadedStems = [];

        try {
            // 1. Upload all pending files to R2
            for (let i = 0; i < files.length; i++) {
                const fileObj = files[i];
                if (fileObj.status === 'completed' && fileObj.r2Key) {
                    uploadedStems.push({
                        name: fileObj.file.name,
                        file_path: fileObj.r2Key,
                        file_size: fileObj.file.size,
                        file_type: fileObj.file.type
                    });
                    continue;
                }

                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

                // Get Presigned URL
                const { success, url, key, error } = await getPresignedUploadUrl(fileObj.file.name, fileObj.file.type);

                if (!success || !url || !key) {
                    console.error("Presign failed:", error);
                    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
                    throw new Error(`Failed to sign URL for ${fileObj.file.name}`);
                }

                // Upload to R2
                const uploadRes = await fetch(url, {
                    method: 'PUT',
                    body: fileObj.file,
                    headers: {
                        'Content-Type': fileObj.file.type
                    }
                });

                if (!uploadRes.ok) {
                    console.error("R2 Upload failed:", uploadRes.statusText);
                    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
                    throw new Error(`Upload failed for ${fileObj.file.name}`);
                }

                // Mark completed
                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed', r2Key: key } : f));

                uploadedStems.push({
                    name: fileObj.file.name,
                    file_path: key,
                    file_size: fileObj.file.size,
                    file_type: fileObj.file.type
                });
            }

            // 2. Prepare data for Server Action
            formData.set('stems', JSON.stringify(uploadedStems));

            // 3. Submit to Supabase (via Server Action)
            // Wrap in startTransition because we are calling it manually after async work
            startTransition(() => {
                formAction(formData);
            });

        } catch (err) {
            console.error("Submission Sequence Failed:", err);
            // Error handling UI could be improved here
        } finally {
            setIsUploadingToR2(false);
        }
    };

    return (
        <form action={handleUploadAndSubmit} className="space-y-8 max-w-2xl mx-auto">
            {/* Project Metadata */}
            <div className="space-y-4 p-6 border border-border bg-surface/30 rounded-lg">
                <h3 className="font-heading text-lg text-white mb-4">Project Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-mono text-muted mb-1.5 uppercase">Project Title</label>
                        <input
                            name="title"
                            type="text"
                            required
                            placeholder="e.g. Midnight City"
                            className="w-full bg-black border border-border p-3 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-neutral-700"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-muted mb-1.5 uppercase">Artist</label>
                        <input
                            name="artist"
                            type="text"
                            required
                            placeholder="e.g. The Weeknd"
                            className="w-full bg-black border border-border p-3 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-neutral-700"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <p className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                            * BPM & Key will be auto-detected by AI Engine
                        </p>
                    </div>
                </div>
            </div>

            {/* Stems Dropzone (Simple Input for now) */}
            <div className="space-y-4 p-6 border border-border bg-surface/30 rounded-lg">
                <h3 className="font-heading text-lg text-white mb-4">Stems Upload</h3>

                <div className="border border-dashed border-border rounded-lg p-8 text-center hover:bg-surface/50 transition-colors relative">
                    <input
                        type="file"
                        multiple
                        accept="audio/*,.wav,.mp3,.aiff"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-muted mx-auto mb-4" />
                    <p className="text-sm text-white font-medium">Click to select or drag stem files here</p>
                    <p className="text-xs text-muted font-mono mt-2">WAV, MP3, AIFF up to 500MB each</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2 mt-6">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-black border border-border rounded text-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full ${f.status === 'completed' ? 'bg-emerald-500' :
                                        f.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                                        }`} />
                                    <span className="text-neutral-300 truncate font-mono text-xs">{f.file.name}</span>
                                </div>
                                <button type="button" onClick={() => removeFile(i)} className="text-muted hover:text-white p-1">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {state.error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-500 text-sm font-mono">
                    ERROR: {state.error}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isPending || isUploadingToR2 || files.length === 0}
                    className="bg-white text-black px-8 py-3 font-mono text-sm uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {(isPending || isUploadingToR2) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending || isUploadingToR2 ? 'Processing protocol...' : 'Initialize Project'}
                </button>
            </div>
        </form>
    );
}
