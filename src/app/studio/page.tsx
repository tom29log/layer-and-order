import { redirect } from 'next/navigation';

export default function StudioIndexPage() {
    // Studio requires a project context. Redirect to Vault to select one.
    redirect('/vault');
}
