import { VaultLayout } from "@/components/vault/VaultLayout";
import { UploadForm } from "@/components/vault/UploadForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
    return (
        <VaultLayout>
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                    <Link href="/vault" className="inline-flex items-center gap-2 text-muted hover:text-white font-mono text-xs mb-4 transition-colors">
                        <ArrowLeft size={14} />
                        BACK_TO_VAULT
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-heading font-light uppercase tracking-tight text-white">
                        New Project
                    </h1>
                    <p className="text-muted font-mono text-xs mt-2">
                        INITIALIZE_ARCHIVE // UPLOAD_STEMS
                    </p>
                </div>

                <UploadForm />
            </div>
        </VaultLayout>
    );
}
