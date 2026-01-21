import { ReactNode } from "react";

export function EditorLayout({
    video,
    sidebar,
    header
}: {
    video: ReactNode;
    sidebar: ReactNode;
    header?: ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row overflow-hidden bg-background">
            {/* Main Content Area (Video) */}
            <div className="flex-1 flex flex-col min-w-0 bg-black/95 relative">
                {header && <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">{header}</div>}

                <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden">
                    <div className="w-full max-w-5xl aspect-video bg-black shadow-2xl rounded-lg overflow-hidden relative">
                        {video}
                    </div>
                </div>
            </div>

            {/* Sidebar (Captions) */}
            <div className="w-full lg:w-[400px] xl:w-[480px] bg-card border-l flex flex-col h-[50vh] lg:h-auto z-20 shadow-xl">
                {sidebar}
            </div>
        </div>
    );
}
