"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                    Update your account's public profile and details.
                </p>
            </div>
            <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="name">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
                        placeholder="Your Name"
                        defaultValue=""
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
                        placeholder="user@example.com"
                        defaultValue=""
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company">
                        Company/Team
                    </label>
                    <input
                        id="company"
                        type="text"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/20 transition focus:ring-2"
                        placeholder="(Optional)"
                        defaultValue=""
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end max-w-md">
                <button
                    type="button"
                    onClick={handleSave}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition",
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
    );
}
