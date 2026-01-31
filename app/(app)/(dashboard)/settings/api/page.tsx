"use client";

import { useState, useEffect } from "react";
import {
    Key,
    Webhook,
    Plus,
    Trash2,
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    Clock,
    ShieldCheck,
    Eye,
    EyeOff,
    RefreshCcw,
    Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type ApiKey = {
    id: string;
    name: string;
    key_prefix: string;
    last_used_at: string | null;
    created_at: string;
    rawKey?: string; // Only present when just created
};

type WebhookRecord = {
    id: string;
    url: string;
    events: string[];
    is_active: boolean;
    secret: string;
    created_at: string;
};

const EVENT_TYPES = [
    { id: "job.completed", label: "Job Completed", description: "Triggered when a job is successfully finished." },
    { id: "job.failed", label: "Job Failed", description: "Triggered when a job encounters an error." },
    { id: "job.started", label: "Job Started", description: "Triggered when a job begins processing." },
    { id: "apikey.created", label: "API Key Created", description: "Triggered when a new API key is generated." },
    { id: "apikey.deleted", label: "API Key Deleted", description: "Triggered when an API key is removed." },
    { id: "webhook.created", label: "Webhook Created", description: "Triggered when a new webhook is added." },
    { id: "webhook.deleted", label: "Webhook Deleted", description: "Triggered when a webhook is removed." },
];

export default function APISettingsPage() {
    const [activeTab, setActiveTab] = useState<"keys" | "webhooks">("keys");
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingKey, setIsCreatingKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
    const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
    const [newWebhookUrl, setNewWebhookUrl] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>(["job.completed", "job.failed"]);
    const [isPending, setIsPending] = useState(false);

    const { toast } = useToast();

    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [keysRes, webhooksRes] = await Promise.all([
                fetch("/api/internal/api-keys"),
                fetch("/api/internal/webhooks")
            ]);
            const keysData = await keysRes.json();
            const webhooksData = await webhooksRes.json();
            setKeys(keysData.keys || []);
            setWebhooks(webhooksData.webhooks || []);
        } catch (error) {
            console.error("Failed to fetch API data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName || isPending) return;
        setIsPending(true);
        try {
            const res = await fetch("/api/internal/api-keys", {
                method: "POST",
                body: JSON.stringify({ name: newKeyName }),
            });
            const data = await res.json();
            if (data.key) {
                setKeys([data.key, ...keys]);
                setCreatedKey(data.key);
                setNewKeyName("");
                setIsCreatingKey(false);
                toast({ title: "API Key Created", description: "Your new key is ready." });
            } else {
                toast({
                    variant: "destructive",
                    title: "Failed to create key",
                    description: data.error || "Unknown error"
                });
            }
        } catch (error) {
            console.error("Failed to create key", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to connect to server." });
        } finally {
            setIsPending(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm("Are you sure you want to delete this API key?") || isPending) return;
        setIsPending(true);
        try {
            const res = await fetch(`/api/internal/api-keys/${id}`, { method: "DELETE" });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id));
                toast({ title: "API Key Deleted" });
            } else {
                const data = await res.json();
                toast({ variant: "destructive", title: "Failed to delete key", description: data.error });
            }
        } catch (error) {
            console.error("Failed to delete key", error);
            toast({ variant: "destructive", title: "Error", description: "Connection failed" });
        } finally {
            setIsPending(false);
        }
    };

    const handleCreateWebhook = async () => {
        if (!newWebhookUrl || isPending) return;
        setIsPending(true);
        try {
            const res = await fetch("/api/internal/webhooks", {
                method: "POST",
                body: JSON.stringify({ url: newWebhookUrl, events: selectedEvents }),
            });
            const data = await res.json();
            if (data.webhook) {
                setWebhooks([data.webhook, ...webhooks]);
                setNewWebhookUrl("");
                setSelectedEvents(["job.completed", "job.failed"]);
                setIsCreatingWebhook(false);
                toast({ title: "Webhook Added", description: "The endpoint has been registered." });
            } else {
                toast({
                    variant: "destructive",
                    title: "Failed to add webhook",
                    description: data.error || "Unknown error"
                });
            }
        } catch (error) {
            console.error("Failed to create webhook", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to connect to server." });
        } finally {
            setIsPending(false);
        }
    };

    const handleDeleteWebhook = async (id: string) => {
        // ... handled in previous chunk ...
        if (!confirm("Are you sure you want to delete this webhook?") || isPending) return;
        setIsPending(true);
        try {
            const res = await fetch(`/api/internal/webhooks/${id}`, { method: "DELETE" });
            if (res.ok) {
                setWebhooks(webhooks.filter(w => w.id !== id));
                toast({ title: "Webhook Deleted" });
            } else {
                const data = await res.json();
                toast({ variant: "destructive", title: "Failed to delete webhook", description: data.error });
            }
        } catch (error) {
            console.error("Failed to delete webhook", error);
            toast({ variant: "destructive", title: "Error", description: "Connection failed" });
        } finally {
            setIsPending(false);
        }
    };

    const handleTestWebhook = async (id: string) => {
        if (isPending) return;
        setIsPending(true);
        try {
            const res = await fetch(`/api/internal/webhooks/${id}/test`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Test Successful", description: `Endpoint returned ${data.status}` });
            } else {
                toast({
                    variant: "destructive",
                    title: "Test Failed",
                    description: data.error || `Endpoint returned ${data.status}`
                });
            }
        } catch (error) {
            console.error("Failed to test webhook", error);
            toast({ variant: "destructive", title: "Error", description: "Request failed" });
        } finally {
            setIsPending(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight">API & Developer Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Integrate our services into your own applications and workflows.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("keys")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        activeTab === "keys"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                >
                    <Key className="size-4" />
                    API Keys
                </button>
                <button
                    onClick={() => setActiveTab("webhooks")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        activeTab === "webhooks"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                >
                    <Webhook className="size-4" />
                    Webhooks
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "keys" ? (
                    <motion.div
                        key="keys"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* API Keys Content */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Your API Keys</h3>
                                <p className="text-sm text-muted-foreground">Authenticate your requests to the public API.</p>
                            </div>
                            <button
                                onClick={() => setIsCreatingKey(true)}
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                            >
                                <Plus className="size-4" />
                                New API Key
                            </button>
                        </div>

                        {/* Create Key Modal/Inline */}
                        {isCreatingKey && (
                            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Key Name</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            placeholder="Production, Automation Tool, etc."
                                            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button
                                            onClick={handleCreateKey}
                                            disabled={!newKeyName || isPending}
                                            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isPending && <RefreshCcw className="size-3 animate-spin" />}
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setIsCreatingKey(false)}
                                            className="px-4 py-2 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* New Key Display (Show only once) */}
                        {createdKey && createdKey.rawKey && (
                            <div className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                    <ShieldCheck className="size-5" />
                                    Key Created Successfully
                                </div>
                                <p className="text-sm">
                                    Make sure to copy your API key now. For your security, <strong className="text-emerald-600">you won't be able to see it again</strong>.
                                </p>
                                <div className="flex items-center gap-2 p-3 bg-background border rounded-xl overflow-hidden">
                                    <code className="text-sm font-mono flex-1 truncate">{createdKey.rawKey}</code>
                                    <button
                                        onClick={() => copyToClipboard(createdKey.rawKey!, "new_key")}
                                        className="p-2 hover:bg-secondary rounded-lg transition"
                                    >
                                        {copiedKey === "new_key" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setCreatedKey(null)}
                                    className="text-sm font-semibold underline underline-offset-4"
                                >
                                    I've saved my key
                                </button>
                            </div>
                        )}

                        {/* Keys List */}
                        <div className="divide-y border rounded-2xl overflow-hidden bg-background">
                            {keys.length === 0 ? (
                                <div className="p-12 text-center space-y-2">
                                    <div className="bg-secondary p-3 rounded-full w-fit mx-auto">
                                        <Key className="size-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium">No API keys yet</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Create a new key to start using our automation tools.</p>
                                </div>
                            ) : (
                                keys.map((key) => (
                                    <div key={key.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Key className="size-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold">{key.name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <code className="bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">{key.key_prefix}••••••••</code>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="size-3" />
                                                        {key.last_used_at ? `Last used ${format(new Date(key.last_used_at), "MMM d, HH:mm")}` : "Never used"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteKey(key.id)}
                                            className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition rounded-lg hover:bg-destructive/10"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-3 text-sm text-amber-700">
                            <AlertCircle className="size-5 shrink-0" />
                            <p>
                                Treat your API keys like passwords. Never share them or check them into version control.
                                Use different keys for different environments or tools to maintain granular control.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="webhooks"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Webhooks Content */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Webhook Subscriptions</h3>
                                <p className="text-sm text-muted-foreground">Receive real-time notifications for job status updates.</p>
                            </div>
                            <button
                                onClick={() => setIsCreatingWebhook(true)}
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                            >
                                <Plus className="size-4" />
                                Add Endpoint
                            </button>
                        </div>

                        {/* Create Webhook Inline */}
                        {isCreatingWebhook && (
                            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold">Endpoint URL</label>
                                    <input
                                        value={newWebhookUrl}
                                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                                        placeholder="https://your-app.com/webhooks"
                                        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold">Select Events</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {EVENT_TYPES.map((type) => (
                                            <label key={type.id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-secondary/20 transition cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEvents.includes(type.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedEvents([...selectedEvents, type.id]);
                                                        } else {
                                                            setSelectedEvents(selectedEvents.filter(id => id !== type.id));
                                                        }
                                                    }}
                                                    className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20"
                                                />
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-bold">{type.label}</span>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">{type.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={handleCreateWebhook}
                                        disabled={!newWebhookUrl || selectedEvents.length === 0 || isPending}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isPending && <RefreshCcw className="size-3 animate-spin" />}
                                        Add Endpoint
                                    </button>
                                    <button
                                        onClick={() => setIsCreatingWebhook(false)}
                                        className="px-4 py-2 text-sm font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Webhooks List */}
                        <div className="grid gap-4">
                            {webhooks.length === 0 ? (
                                <div className="divide-y border rounded-2xl overflow-hidden bg-background">
                                    <div className="p-12 text-center space-y-2">
                                        <div className="bg-secondary p-3 rounded-full w-fit mx-auto">
                                            <Webhook className="size-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium">No webhooks yet</p>
                                        <p className="text-xs text-muted-foreground">Connect your system to receive job events automatically.</p>
                                    </div>
                                </div>
                            ) : (
                                webhooks.map((webhook) => (
                                    <div key={webhook.id} className="p-6 rounded-2xl border bg-background group space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-2 rounded-full",
                                                    webhook.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted"
                                                )} />
                                                <span className="text-sm font-bold truncate max-w-[300px]">{webhook.url}</span>
                                                <ExternalLink className="size-3 text-muted-foreground" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleTestWebhook(webhook.id)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition"
                                                >
                                                    <Play className="size-3" />
                                                    Test
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteWebhook(webhook.id)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {webhook.events.map((event: string) => (
                                                <span key={event} className="px-2 py-1 rounded-md bg-secondary text-[10px] font-bold uppercase tracking-wider">
                                                    {event}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Signing Secret</span>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-[10px] font-mono bg-muted px-2 py-1 rounded">••••••••••••••••</code>
                                                    <button
                                                        onClick={() => copyToClipboard(webhook.secret, `secret_${webhook.id}`)}
                                                        className="p-1 hover:bg-secondary rounded transition"
                                                    >
                                                        {copiedKey === `secret_${webhook.id}` ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-muted-foreground" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Created</span>
                                                <span className="text-[10px]">{format(new Date(webhook.created_at), "MMM d, yyyy")}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3 text-sm text-blue-700">
                            <RefreshCcw className="size-5 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-semibold">Delivery Logs</p>
                                <p className="text-xs">
                                    Logs for your webhook deliveries will be available here soon. We retry failed
                                    deliveries up to 3 times automatically.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
