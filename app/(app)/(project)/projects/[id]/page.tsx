import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Library, Settings, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { listAssets } from "@/lib/assets/repository";

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Fetch user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch Project details
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    if (projectError || !project) return notFound();

    // Fetch some stats
    const { assets } = await listAssets(supabase, user.id, projectId, 5);

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.description || "No description provided."}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={routes.studio(projectId)}>
                        <Button className="gap-2 px-6">
                            <Zap className="size-4 fill-current" />
                            Open Editor
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-primary/[0.02] border-primary/10 transition-colors hover:border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Library className="size-4 text-primary" />
                            Assets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assets.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Files in this project</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            Created
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {new Date(project.created_at).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Project creation date</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Settings className="size-4 text-primary" />
                            Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/projects/${projectId}/settings`}>
                            <Button variant="ghost" size="sm" className="w-full justify-start px-0 hover:bg-transparent hover:text-primary">
                                Manage project settings →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Content</CardTitle>
                        <CardDescription>Recently added media to this project</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {assets.length > 0 ? (
                            <div className="divide-y divide-border">
                                {assets.map((asset) => (
                                    <div key={asset.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                        <div className="size-10 rounded bg-muted flex items-center justify-center shrink-0">
                                            <FileText className="size-5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{asset.filename}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{asset.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-sm text-muted-foreground">
                                No assets found. Start by adding media in the editor.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center p-12 text-center gap-4 bg-gradient-to-br from-primary/[0.03] to-background border-dashed">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="size-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold">Ready to Edit?</h3>
                        <p className="text-sm text-muted-foreground max-w-[240px]">
                            Compose your sequence, add subtitles, and export professional videos.
                        </p>
                    </div>
                    <Link href={routes.studio(projectId)}>
                        <Button variant="outline" className="mt-2">
                            Go to Sequence Editor
                        </Button>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
