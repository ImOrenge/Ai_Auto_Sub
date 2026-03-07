"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Users,
    Settings,
    Activity,
    BarChart3,
    Database,
    ShieldCheck,
    RefreshCw,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    Play
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/i18n";

type AdminStats = {
    totalUsers: number;
    totalJobs: number;
    totalProjects: number;
    statsByStatus: Record<string, number>;
};

type AdminUser = {
    id: string;
    email: string;
    createdAt: string;
    lastSignIn: string;
    isSuperAdmin: boolean;
};

type AdminJob = {
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    url: string;
};

export default function AdminDashboardPage() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [jobs, setJobs] = useState<AdminJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "jobs">("overview");

    const fetchData = useCallback(async () => {
        setLoading(true);
        console.log("[Admin UI] Fetching dashboard data...");
        try {
            const [statsRes, usersRes, jobsRes] = await Promise.all([
                fetch("/api/admin/stats"),
                fetch("/api/admin/users"),
                fetch("/api/admin/jobs"),
            ]);

            console.log("[Admin UI] Responses received:", {
                stats: statsRes.status,
                users: usersRes.status,
                jobs: jobsRes.status
            });

            const parseJson = async (res: Response, name: string) => {
                if (!res.ok) {
                    console.error(`[Admin UI] ${name} API call failed with status: ${res.status} ${res.statusText}`);
                    return {};
                }
                const text = await res.text();
                console.log(`[Admin UI] ${name} response text (first 100 chars):`, text.substring(0, 100));
                if (!text) {
                    console.error(`[Admin UI] ${name} returned an empty response`);
                    return {};
                }
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error(`[Admin UI] Failed to parse ${name} JSON:`, e);
                    return {};
                }
            };

            const [statsData, usersData, jobsData] = await Promise.all([
                parseJson(statsRes, "stats"),
                parseJson(usersRes, "users"),
                parseJson(jobsRes, "jobs"),
            ]);

            setStats(statsData);
            setUsers(usersData.users || []);
            setJobs(jobsData.jobs || []);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading && !stats) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded"></div>)}
                </div>
                <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        {t("dashboard.admin.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-xs uppercase font-bold tracking-[0.15em] opacity-80">
                        {t("dashboard.admin.subtitle")}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {t("dashboard.admin.refresh")}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeTab === "overview"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        }`}
                >
                    {t("dashboard.admin.tabs.overview")}
                    {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeTab === "users"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        }`}
                >
                    {t("dashboard.admin.tabs.users")}
                    {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button
                    onClick={() => setActiveTab("jobs")}
                    className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeTab === "jobs"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        }`}
                >
                    {t("dashboard.admin.tabs.jobs")}
                    {activeTab === "jobs" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
            </div>

            {activeTab === "overview" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<Users className="w-5 h-5" />} label={t("dashboard.admin.stats.totalUsers")} value={stats?.totalUsers || 0} color="blue" />
                        <StatCard icon={<Database className="w-5 h-5" />} label={t("dashboard.admin.stats.totalProjects")} value={stats?.totalProjects || 0} color="purple" />
                        <StatCard icon={<Activity className="w-5 h-5" />} label={t("dashboard.admin.stats.totalJobs")} value={stats?.totalJobs || 0} color="green" />
                        <StatCard icon={<Clock className="w-5 h-5" />} label={t("dashboard.admin.stats.activeJobs")} value={stats?.statsByStatus?.processing || 0} color="amber" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-sm rounded-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-gray-400" />
                                {t("dashboard.admin.overview.distribution")}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {Object.entries(stats?.statsByStatus || {}).map(([status, count]) => (
                                    <div key={status} className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{status}</p>
                                        <p className="text-2xl font-mono font-bold">{count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-sm rounded-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-gray-400" />
                                {t("dashboard.admin.overview.health")}
                            </h3>
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-500">{t("dashboard.admin.overview.latency")}</span>
                                    <span className="text-green-600">42ms</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-500">{t("dashboard.admin.overview.uptime")}</span>
                                    <span className="text-green-600">99.9%</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500">{t("dashboard.admin.overview.dbConnections")}</span>
                                    <span className="text-gray-900 dark:text-gray-100">8/20</span>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    {t("dashboard.admin.overview.operational")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold">{t("dashboard.admin.users.title")}</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t("dashboard.admin.users.search")}
                                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none text-sm w-64 focus:ring-1 focus:ring-blue-600 outline-none"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">{t("dashboard.admin.users.table.user")}</th>
                                    <th className="px-6 py-4">{t("dashboard.admin.users.table.created")}</th>
                                    <th className="px-6 py-4">{t("dashboard.admin.users.table.lastSignIn")}</th>
                                    <th className="px-6 py-4">{t("dashboard.admin.users.table.privileges")}</th>
                                    <th className="px-6 py-4 text-right">{t("dashboard.admin.users.table.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm">{user.email}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{user.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(user.createdAt), "yyyy.MM.dd")}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.lastSignIn ? format(new Date(user.lastSignIn), "yyyy.MM.dd HH:mm") : t("dashboard.admin.users.never")}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isSuperAdmin ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {t("dashboard.admin.users.superAdmin")}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-500">
                                                    {t("dashboard.admin.users.userRole")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "jobs" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold">{t("dashboard.admin.jobs.title")}</h3>
                        <div className="flex gap-2">
                            <button className="p-2 bg-gray-50 dark:bg-gray-800 rounded-none border-none text-gray-400 hover:text-blue-600 transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">{t("dashboard.admin.jobs.table.resource")}</th>
                                    <th className="px-6 py-4">{t("dashboard.admin.jobs.table.status")}</th>
                                    <th className="px-6 py-4">{t("dashboard.admin.jobs.table.created")}</th>
                                    <th className="px-6 py-4 text-right">{t("dashboard.admin.jobs.table.reference")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {jobs.map(job => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm max-w-[200px] truncate">{job.id}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono truncate max-w-[300px]">{job.url}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(job.created_at), "MM.dd HH:mm:ss")}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-[10px] text-gray-400 font-mono">USER_{job.user_id.substring(0, 8)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: 'blue' | 'purple' | 'green' | 'amber' }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/10",
        purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/10",
        green: "text-green-600 bg-green-50 dark:bg-green-900/10",
        amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/10",
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm rounded-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
                    <p className="text-2xl font-mono font-bold mt-0.5">{value.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();

    if (s === 'done') return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/10 text-[10px] font-black uppercase text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" /> Done
        </span>
    );

    if (['pending', 'processing', 'downloading', 'stt', 'translating', 'subtitle'].includes(s)) return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/10 text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">
            <Play className="w-3 h-3 animate-pulse" /> {s}
        </span>
    );

    if (s === 'error') return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 dark:bg-red-900/10 text-[10px] font-black uppercase text-red-700 dark:text-red-400">
            <AlertCircle className="w-3 h-3" /> Error
        </span>
    );

    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-500">
            {s}
        </span>
    );
}
