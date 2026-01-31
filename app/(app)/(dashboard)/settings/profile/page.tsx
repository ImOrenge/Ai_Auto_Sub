"use client";

import { useState, useEffect } from "react";
import { Save, Check, User, Mail, Calendar, Hash, BadgeCheck, Loader2, Clock, Activity, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

type UserProfile = {
    user: {
        id: string;
        email: string;
        name: string;
        created_at: string;
        last_sign_in_at: string;
    };
    subscription: {
        plan: string;
        status: string;
        currentPeriodEnd: string;
    };
};

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/internal/user-profile");
            const data = await res.json();
            if (data.user) {
                setProfile(data);
                setName(data.user.name);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            const res = await fetch("/api/auth/delete-account", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete account");
            }
            // Redirect to home page after successful deletion
            router.push("/");
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your personal information and account details.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Editable Section */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold" htmlFor="name">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    readOnly
                                    className="w-full rounded-xl border border-secondary bg-secondary/50 pl-10 pr-4 py-2.5 text-sm text-muted-foreground outline-none cursor-not-allowed"
                                    value={profile?.user.email || ""}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold" htmlFor="company">
                                Company/Team
                            </label>
                            <input
                                id="company"
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
                                placeholder="(Optional)"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSave}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition shadow-sm",
                                saved
                                    ? "bg-emerald-500 text-white"
                                    : "bg-primary text-primary-foreground hover:opacity-90"
                            )}
                        >
                            {saved ? (
                                <>
                                    <Check className="size-4" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Account Details / Registration Data */}
                <div className="space-y-6">
                    <div className="rounded-2xl border bg-secondary/20 p-6 space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <BadgeCheck className="size-4 text-primary" />
                            Account Overview
                        </h3>

                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <BadgeCheck className="size-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Current Plan</span>
                                        <span className="text-sm font-bold">{profile?.subscription.plan}</span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                    {profile?.subscription.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Calendar className="size-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Joined At</span>
                                    <span className="text-sm font-bold">
                                        {profile?.user.created_at ? format(new Date(profile.user.created_at), "PPP") : "-"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <Clock className="absolute size-4 opacity-0" />
                                    <Activity className="size-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Last Activity</span>
                                    <span className="text-sm font-bold">
                                        {profile?.user.last_sign_in_at ? format(new Date(profile.user.last_sign_in_at), "MMM d, HH:mm") : "-"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <Hash className="size-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">User ID</span>
                                    <span className="text-[10px] font-mono font-medium text-muted-foreground truncate max-w-[180px]">
                                        {profile?.user.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Your account was created using {profile?.user.email}.
                                If you need to migrate your data or change your login provider, please contact support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. All your data, projects, and exports will be permanently removed.
                </p>
                {deleteError && (
                    <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-lg">{deleteError}</p>
                )}
                {!showDeleteConfirm ? (
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-red-500 border border-red-500/30 hover:bg-red-500/10 transition"
                    >
                        <Trash2 className="size-4" />
                        Delete Account
                    </button>
                ) : (
                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-sm font-semibold text-red-600">
                            Are you sure? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {deleteLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Trash2 className="size-4" />
                                )}
                                Yes, Delete My Account
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border border-border hover:bg-secondary transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
