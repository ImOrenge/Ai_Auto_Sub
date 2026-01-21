import { createClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, type = 'general' } = json;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verify project ownership/access first
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();
    
    if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('queues')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name,
        // TODO: Handle 'type' options if schema supports it, for now storing in default_options or just name
        default_options: { type }, 
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ queue: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id) // Extra safety
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ queues: data });
}
