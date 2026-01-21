import { createClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, description } = json;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-create default queue
    const { error: queueError } = await supabase
        .from('queues')
        .insert({
            user_id: user.id,
            project_id: data.id,
            name: 'General Queue',
            default_options: { type: 'general' }
        });

    if (queueError) {
        console.error("Failed to create default queue for project", data.id, queueError);
        // We don't fail the request, but we log it. 
        // Logic could be added to delete the project if this fails, but it's better to allow "empty" projects and let user retry queue creation.
    }

    return NextResponse.json({ project: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
