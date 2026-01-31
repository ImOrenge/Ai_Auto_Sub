"use client";

import { useState } from "react";
import { useEditor, EditorLayer } from "./EditorContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Copy,
    Trash2,
    Layers,
    MoreVertical,
    Check,
    X,
    Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LayerManager() {
    const {
        layers,
        activeLayerId,
        addLayer,
        duplicateLayer,
        deleteLayer,
        switchLayer,
        updateLayerName
    } = useEditor();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const handleStartEdit = (layer: EditorLayer) => {
        setEditingId(layer.id);
        setEditValue(layer.name);
    };

    const handleSaveEdit = () => {
        if (editingId && editValue.trim()) {
            updateLayerName(editingId, editValue.trim());
        }
        setEditingId(null);
    };


    return (
        <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Layers className="size-3.5 text-primary" />
                    <span>Layers</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-md hover:bg-primary/10 hover:text-primary"
                    onClick={() => addLayer()}
                >
                    <Plus className="size-3.5" />
                </Button>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {layers.map((layer) => (
                    <div
                        key={layer.id}
                        className={cn(
                            "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all cursor-pointer border border-transparent",
                            activeLayerId === layer.id
                                ? "bg-primary/10 border-primary/20 text-primary font-medium"
                                : "hover:bg-muted text-muted-foreground"
                        )}
                        onClick={() => activeLayerId !== layer.id && switchLayer(layer.id)}
                    >
                        <div className="flex-1 min-w-0">
                            {editingId === layer.id ? (
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <Input
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                        className="h-7 text-xs px-2 focus-visible:ring-primary"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={handleSaveEdit}>
                                        <Check className="size-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={() => setEditingId(null)}>
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="text-xs truncate block">{layer.name}</span>
                            )}
                        </div>

                        {editingId !== layer.id && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical className="size-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem onClick={() => handleStartEdit(layer)}>
                                        <Edit2 className="size-3 mr-2" />
                                        <span>Rename</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => duplicateLayer(layer.id)}>
                                        <Copy className="size-3 mr-2" />
                                        <span>Duplicate</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => deleteLayer(layer.id)}
                                        disabled={layers.length <= 1}
                                    >
                                        <Trash2 className="size-3 mr-2" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
