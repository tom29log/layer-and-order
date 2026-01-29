'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface ProfileUpdateData {
    nickname?: string;
    bio?: string;
    avatar_url?: string;
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: 'Unauthorized' };
    }

    const nickname = formData.get('nickname') as string;
    const bio = formData.get('bio') as string;
    const avatar_url = formData.get('avatar_url') as string;

    const updates: ProfileUpdateData = {};
    if (nickname !== null) updates.nickname = nickname;
    if (bio !== null) updates.bio = bio;
    if (avatar_url) updates.avatar_url = avatar_url;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) {
        console.error('Profile Update Error:', error);
        return { error: 'Failed to update profile' };
    }

    revalidatePath('/vault/me');
    return { success: true };
}

export async function updateProjectTitle(projectId: string, newTitle: string) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('projects')
        .update({ title: newTitle })
        .eq('id', projectId)
        .eq('user_id', user.id); // Ensure ownership

    if (error) {
        console.error('Update Title Error:', error);
        return { error: 'Failed to update title' };
    }

    revalidatePath('/vault/me');
    return { success: true };
}
