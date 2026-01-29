'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Save, User, Loader2, Camera } from 'lucide-react';
import { updateProfile } from '@/app/actions/profile';
import { getPresignedUploadUrl } from '@/app/actions/upload';

interface Profile {
    id: string;
    email: string;
    nickname?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    is_pro: boolean;
}

interface ProfileEditorProps {
    profile: Profile | null;
    userId: string;
}

export function ProfileEditor({ profile, userId }: ProfileEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select an image file' });
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image must be less than 5MB' });
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setMessage(null);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        setMessage(null);

        try {
            let avatarUrl = profile?.avatar_url || null;

            // Upload avatar if new file selected
            if (avatarFile) {
                setIsUploading(true);
                const { success, url, key, error } = await getPresignedUploadUrl(
                    `avatar_${userId}_${Date.now()}.${avatarFile.name.split('.').pop()}`,
                    avatarFile.type
                );

                if (!success || !url || !key) {
                    throw new Error(error || 'Failed to get upload URL');
                }

                const uploadRes = await fetch(url, {
                    method: 'PUT',
                    body: avatarFile,
                    headers: { 'Content-Type': avatarFile.type }
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload image');
                }

                // Construct the public URL (assuming R2 public access or CDN)
                avatarUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
                setIsUploading(false);
            }

            // Add avatar_url to form data
            formData.set('avatar_url', avatarUrl || '');

            const result = await updateProfile(formData);
            if (result.success) {
                setMessage({ type: 'success', text: '프로필이 저장되었습니다!' });
                setAvatarFile(null);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-8">
            <input type="hidden" name="userId" value={userId} />

            {/* Avatar Section with File Upload */}
            <div className="flex flex-col items-center gap-4">
                <div
                    className="relative w-32 h-32 rounded-full bg-surface border-2 border-border flex items-center justify-center overflow-hidden cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={48} className="text-muted" />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                />

                <p className="text-xs font-mono text-muted">클릭하여 프로필 사진 변경</p>
            </div>

            {/* Nickname Section */}
            <div>
                <label className="block text-xs font-mono text-muted mb-1.5 uppercase">Nickname</label>
                <input
                    name="nickname"
                    type="text"
                    defaultValue={profile?.nickname || ''}
                    placeholder="Enter your nickname"
                    className="w-full bg-black border border-border p-3 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-neutral-700"
                />
            </div>

            {/* Bio Section */}
            <div>
                <label className="block text-xs font-mono text-muted mb-1.5 uppercase">Bio</label>
                <textarea
                    name="bio"
                    defaultValue={profile?.bio || ''}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full bg-black border border-border p-3 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-neutral-700 resize-none"
                />
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3 p-4 border border-border bg-surface/30">
                <span className={`w-2 h-2 rounded-full ${profile?.is_pro ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                <span className="font-mono text-xs text-white uppercase tracking-widest">
                    {profile?.is_pro ? 'PRO MEMBER' : 'FREE TIER'}
                </span>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 border text-sm font-mono ${message.type === 'success'
                        ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-500'
                        : 'bg-red-900/20 border-red-500/50 text-red-500'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="bg-white text-black px-8 py-3 font-mono text-sm uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {(isSaving || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

