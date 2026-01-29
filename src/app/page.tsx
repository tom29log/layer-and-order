import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grid">
      <div className="text-center space-y-6">
        <h1 className="text-6xl md:text-8xl font-heading font-semibold tracking-tighter text-white">
          LAYER & ORDER
        </h1>
        <p className="text-xl md:text-2xl font-mono text-muted">
          STEM ARCHIVE & AI MASTERING
        </p>
        <div className="pt-8">
          <Link
            href="/vault"
            className="inline-block px-8 py-4 bg-surface border border-border hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase font-mono tracking-widest text-sm group"
          >
            Enter The Studio <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
