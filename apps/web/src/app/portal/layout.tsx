export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl text-indigo-600 flex items-center gap-2">
                        <span>🌍</span>
                        <span>NovaScore Athlete</span>
                    </div>
                    <nav className="flex gap-4 text-sm font-medium text-slate-600">
                        {/* Navigation items can go here */}
                    </nav>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
