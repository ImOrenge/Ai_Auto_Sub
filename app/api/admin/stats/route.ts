import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  console.log("[Admin API] Fetching stats...");
  if (!(await isAdmin())) {
    console.warn("[Admin API] Stats Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  try {
    // Fetch users using admin API (more reliable than querying auth.users table)
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error("[Admin API] Failed to list users:", usersError);
    }

    // Fetch total jobs
    const { count: totalJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });
    
    if (jobsError) {
      console.error("[Admin API] Failed to count jobs:", jobsError);
    }

    // Fetch jobs by status for distribution
    const { data: statusStats, error: statusError } = await supabase
      .from("jobs")
      .select("status");
    
    if (statusError) {
      console.error("[Admin API] Failed to fetch job statuses:", statusError);
    }
    
    const statsByStatus = statusStats?.reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    // Fetch total projects
    const { count: totalProjects, error: projectsError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });

    if (projectsError) {
      console.error("[Admin API] Failed to count projects:", projectsError);
    }

    const responseData = {
      totalUsers: usersData?.users?.length || 0,
      totalJobs: totalJobs || 0,
      totalProjects: totalProjects || 0,
      statsByStatus: statsByStatus || {},
    };

    console.log("[Admin API] Stats successfully compiled");
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[Admin API] Stats crash:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
