
import { ProjectSidebar } from "@/components/sidebar/ProjectSidebar";
import { Header } from "@/components/Header";

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
    const { id } = await params;
    // Auth state assumed handled by middleware
    const isAuthenticated = true;

    return (
        <div className="relative flex min-h-screen flex-col">
            <Header
                isAuthenticated={isAuthenticated}
                title={
                    <span className="hidden rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground sm:inline">
                        Workspace
                    </span>
                }
            />
            <div className="flex flex-1">
                <ProjectSidebar projectId={id} />
                <main className="flex-1 md:pl-60">
                    {children}
                </main>
            </div>
        </div>
    );
}
