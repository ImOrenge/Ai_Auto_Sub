import { createClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';
import { BillingService } from "@/lib/billing/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, description } = json;

    const entitlements = await BillingService.getEntitlements(user.id);
    if (entitlements.projects.currentCount >= entitlements.projects.maxLimit) {
      return NextResponse.json({ 
        error: `Project limit reached (${entitlements.projects.currentCount}/${entitlements.projects.maxLimit}). Please upgrade your plan.` 
      }, { status: 403 });
    }

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

    const { error: queueError } = await supabase
        .from('queues')
        .insert({
            user_id: user.id,
            project_id: data.id,
            name: 'Default',
            default_options: { type: 'general' }
        });

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

  return NextResponse.json({ projects: data ?? [] });
}
