import { SupabaseClient } from "@supabase/supabase-js";
import { Project } from "./types";
import { mapProject } from "./mapper";

export async function getProjectById(supabase: SupabaseClient, id: string): Promise<Project | null> {
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return mapProject(data);
}

export async function listProjects(supabase: SupabaseClient, userId: string): Promise<Project[]> {
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProject);
}
