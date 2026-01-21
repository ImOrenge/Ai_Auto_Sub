import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  return NextResponse.json({ 
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    envUrl: env.supabaseUrl 
  });
}
