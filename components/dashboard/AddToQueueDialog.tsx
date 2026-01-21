"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueRecord } from "@/lib/queues/types";

interface AddToQueueDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    selectedJobIds: string[];
    onSuccess?: () => void;
}

export function AddToQueueDialog({ isOpen, onClose, projectId, selectedJobIds, onSuccess }: AddToQueueDialogProps) {
    const [queues, setQueues] = useState<QueueRecord[]>([]);
    const [selectedQueueId, setSelectedQueueId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isOpen && projectId) {
            setIsFetching(true);
            fetch(`/api/projects/${projectId}/queues`)
                .then(res => res.json())
                .then(data => {
                    if (data.queues) {
                        setQueues(data.queues);
                        // Default to first if available
                        if (data.queues.length > 0) {
                            setSelectedQueueId(data.queues[0].id);
                        }
                    }
                })
                .catch(console.error)
                .finally(() => setIsFetching(false));
        }
    }, [isOpen, projectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQueueId || selectedJobIds.length === 0) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/queue/${selectedQueueId}/jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assetIds: selectedJobIds }),
            });

            if (!res.ok) throw new Error("Failed to add jobs to queue");

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to add jobs to queue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add to Queue</DialogTitle>
                    <DialogDescription>
                        Add {selectedJobIds.length} selected items to a queue for processing.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="queue">Queue</Label>
                            {isFetching ? (
                                <div className="text-sm text-muted-foreground">Loading queues...</div>
                            ) : queues.length === 0 ? (
                                <div className="text-sm text-yellow-600">No queues found. Please create one first.</div>
                            ) : (
                                <Select value={selectedQueueId} onValueChange={setSelectedQueueId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a queue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {queues.map(q => (
                                            <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || queues.length === 0 || !selectedQueueId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add to Queue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
