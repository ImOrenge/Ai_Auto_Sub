"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
    onQueueCreated: (queue: any) => void;
}

export function CreateQueueModal({ isOpen, onClose, projectId, onQueueCreated }: CreateQueueModalProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [type, setType] = useState("general"); // general | translation | subtitle?
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !projectId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/queues`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type }),
            });

            if (!res.ok) throw new Error("Failed to create queue");

            const data = await res.json();
            onQueueCreated(data.queue);

            // Reset and close
            setName("");
            setType("general");
            onClose();
            router.refresh(); // Refresh server components if needed
        } catch (error) {
            console.error(error);
            // TODO: Show toast error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>새 큐 만들기</DialogTitle>
                    <DialogDescription>
                        이 프로젝트에 새로운 작업 큐를 추가합니다.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qSelect" className="text-right">
                                유형
                            </Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="큐 유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">일반 (General)</SelectItem>
                                    <SelectItem value="translation">번역 (Translation)</SelectItem>
                                    <SelectItem value="shorts">쇼츠 (Shorts)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qName" className="text-right">
                                이름
                            </Label>
                            <Input
                                id="qName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예: 영한 번역 큐"
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            취소
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim() || !projectId}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            큐 생성
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
