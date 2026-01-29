'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface StemData {
    name: string;
    file_path: string;
    file_size: number;
    file_type: string;
}

interface CreateProjectState {
    error?: string;
    success?: boolean;
}

export async function createProject(prevState: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: 'Unauthorized' };
    }

    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const stemsJson = formData.get('stems') as string;

    // Simulate AI Analysis for BPM and Key since they are now auto-detected
    const bpm = Math.floor(Math.random() * (140 - 80 + 1)) + 80; // Random BPM 80-140
    const keys = ['C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor'];
    const key = keys[Math.floor(Math.random() * keys.length)];

    if (!title) {
        return { error: 'Title is required' };
    }

    let stems: StemData[] = [];
    try {
        stems = JSON.parse(stemsJson || '[]');
    } catch {
        return { error: 'Invalid stem data' };
    }

    // 1. Insert Project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            title,
            artist,
            bpm,
            key_signature: key,
            is_public: false, // Default to private
        })
        .select()
        .single();

    if (projectError) {
        console.error('Project Insert Error:', projectError);
        return { error: 'Failed to create project' };
    }

    // 2. Insert Stems
    if (stems.length > 0) {
        const stemsToInsert = stems.map(stem => ({
            project_id: project.id,
            name: stem.name,
            file_path: stem.file_path,
            file_size: stem.file_size,
            file_type: stem.file_type
        }));

        const { error: stemsError } = await supabase
            .from('stems')
            .insert(stemsToInsert);

        if (stemsError) {
            console.error('Stems Insert Error:', stemsError);
            // Optional: Delete project if stems fail? For now, keep project as empty.
            return { error: 'Project started but stems failed to save.' };
        }
    }

    revalidatePath('/vault');
    redirect('/vault');
}
